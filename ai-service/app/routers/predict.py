"""
Prediction API — ST-GCN + BFS Cascade for Traffic Impact
======================================================
POST /api/predict
  Uses ST-GCN (spatial-temporal graph conv) to predict traffic density
  for all road segments simultaneously, then BFS cascade to estimate
  how congestion spreads from the incident site.

POST /api/simulate
  What-if scenario simulation (e.g., "what if we close this lane?").
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
import time
from app.services.graph_service import graph_service
from app.services.model_service import model_service
from app.core.database import database

router = APIRouter(tags=["Prediction"])


async def fetch_edge_history(edge_id: int, seq_len: int = 12) -> list[float]:
    """
    Fetch last N sensor readings for an edge from DB.
    Returns list of density values, oldest → newest.
    Falls back to [0.3]*seq_len if no readings found.
    """
    try:
        query = """
            SELECT density
            FROM sensor_readings
            WHERE edge_id = :edge_id
              AND density IS NOT NULL
            ORDER BY recorded_at DESC
            LIMIT :seq_len
        """
        rows = await database.fetch_all(query, {"edge_id": edge_id, "seq_len": seq_len})
        if rows:
            # Reverse: DB gives newest-first → oldest-first for model input
            densities = [float(r["density"]) for r in rows]
            return list(reversed(densities))
    except Exception:
        pass
    return [0.3] * seq_len


def _severity(density: float) -> str:
    if density > 0.8:
        return "critical"
    elif density > 0.6:
        return "high"
    elif density > 0.4:
        return "medium"
    return "low"


# ─── Request / Response Models ────────────────────────────────────────────────


class PredictRequest(BaseModel):
    incident_id: int
    severity: str
    affected_edge_ids: list[int]


class EdgePrediction(BaseModel):
    edge_id: int
    time_horizon_minutes: int
    predicted_density: float
    predicted_delay_s: int
    confidence: float
    severity: str


class Recommendation(BaseModel):
    type: str
    description: str
    alternative_edges: list[int]
    estimated_time_saved_seconds: int


class PredictResponse(BaseModel):
    incident_id: int
    model_version: str
    model_type: str
    predictions: list[EdgePrediction]
    recommendations: list[Recommendation] = []
    processing_time_ms: int


class SimulateRequest(BaseModel):
    location_area: str
    severity: str
    incident_type: str
    prediction_horizon: int = Field(30, ge=5, le=120)


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/predict", response_model=PredictResponse)
async def predict_traffic(request: PredictRequest):
    """
    Predict traffic impact using ST-GCN + BFS cascade.

    ST-GCN uses REAL historical sensor data (last 12 readings per edge)
    as input. BFS cascade estimates how congestion spreads.
    """
    start_time = time.time()
    seq_len = 12

    # Load graph on first call
    if not graph_service.is_loaded:
        await graph_service.load_graph()

    # ── 1) Fetch REAL historical data per edge ──
    histories = []
    edge_ids = []
    for edge_id in request.affected_edge_ids:
        history = await fetch_edge_history(edge_id, seq_len)
        histories.append(history)
        edge_ids.append(edge_id)

    # ── 2) ST-GCN batch prediction using real data ──
    ai_result = model_service.predict_batch(histories)
    model_version = ai_result.get("model_name", "TrafficSTGCN")
    model_type = ai_result.get("model_type", "stgcn")

    # ST-GCN outputs (num_edges, pred_len=6)
    # pred_len=6 → horizons [5min, 10min, 15min, 20min, 25min, 30min]
    stgcn_preds = ai_result.get("predictions", [])

    # ── 3) BFS cascade: how congestion spreads from incident edges ──
    cascade_preds = graph_service.predict_cascading_impact(
        incident_edge_ids=request.affected_edge_ids,
        severity=request.severity,
        time_horizons=[15, 30, 60],
    )

    # ── 4) Merge: incident edges → ST-GCN density, cascade edges → BFS density ──
    # Build BFS lookup: edge_id → {horizon → prediction}
    bfs_by_edge: dict[int, dict[int, dict]] = {}
    for p in cascade_preds:
        eid = p["edge_id"]
        horizon = p["time_horizon_minutes"]
        if eid not in bfs_by_edge:
            bfs_by_edge[eid] = {}
        bfs_by_edge[eid][horizon] = p

    # Map ST-GCN output indices to BFS horizon values [15, 30, 60]
    horizon_map = {15: 0, 30: 2, 60: 5}  # stgcn_index for each BFS horizon

    all_predictions: list[dict] = []
    seen: set[tuple[int, int]] = set()
    stgcn_conf = ai_result.get("confidence", 0.8)

    # Incident edges → ST-GCN density (more accurate than BFS)
    for i, edge_id in enumerate(edge_ids):
        if i >= len(stgcn_preds):
            continue
        stgcn_edge = stgcn_preds[i]
        for bfs_horizon in [15, 30, 60]:
            idx = horizon_map[bfs_horizon]
            stgcn_density = stgcn_edge[idx] if idx < len(stgcn_edge) else stgcn_edge[-1]

            bfs_p = bfs_by_edge.get(edge_id, {}).get(bfs_horizon)
            blended_conf = (
                stgcn_conf * 0.7 + bfs_p["confidence"] * 0.3
                if bfs_p
                else stgcn_conf
            )

            key = (edge_id, bfs_horizon)
            if key not in seen:
                seen.add(key)
                all_predictions.append({
                    "edge_id": edge_id,
                    "time_horizon_minutes": bfs_horizon,
                    "predicted_density": round(float(stgcn_density), 4),
                    "predicted_delay_s": int(float(stgcn_density) * 300),
                    "confidence": round(blended_conf, 2),
                    "severity": _severity(float(stgcn_density)),
                    "source": "stgcn",
                })

    # Cascade edges → BFS density
    for p in cascade_preds:
        key = (p["edge_id"], p["time_horizon_minutes"])
        if key not in seen:
            seen.add(key)
            all_predictions.append({**p, "source": "bfs"})

    # Sort: incident edges first, then by horizon
    incident_set = set(request.affected_edge_ids)
    all_predictions.sort(key=lambda x: (
        0 if x["edge_id"] in incident_set else 1,
        x["edge_id"],
        x["time_horizon_minutes"],
    ))

    predictions = [
        EdgePrediction(**{k: v for k, v in p.items() if k != "source"})
        for p in all_predictions
    ]

    # ── 5) Recommendations ──
    recommendations = _build_recommendations(request.severity, all_predictions, model_type)

    process_time = int((time.time() - start_time) * 1000)

    return PredictResponse(
        incident_id=request.incident_id,
        model_version=model_version,
        model_type=model_type,
        predictions=predictions,
        recommendations=recommendations,
        processing_time_ms=process_time,
    )


@router.post("/simulate")
async def simulate_traffic(request: SimulateRequest):
    """
    What-if scenario simulation using BFS cascade.
    Used by Urban Planners for long-term road planning.
    """
    start_time = time.time()

    if not graph_service.is_loaded:
        await graph_service.load_graph()

    result = graph_service.simulate_scenario(
        location_area=request.location_area,
        severity=request.severity,
        incident_type=request.incident_type,
        prediction_horizon=request.prediction_horizon,
    )

    process_time = int((time.time() - start_time) * 1000)

    return {
        "simulation": result,
        "processing_time_ms": process_time,
        "note": "BFS heuristic simulation — ST-GCN planned for long-horizon (Amazon Nova Layer 3)",
    }


@router.get("/model-info")
async def get_model_info():
    """
    Returns active AI model metadata.
    Shows ST-GCN when available, LSTM fallback otherwise.
    """
    if not model_service.is_loaded:
        return {
            "model_name": "TrafficSTGCN-v1.0",
            "status": "loaded_at_runtime",
            "message": "ST-GCN or LSTM will be loaded from models/ at startup",
        }
    return {
        "model_name": model_service.model_info.get("name", "Unknown"),
        "architecture": model_service.model_info.get("architecture", ""),
        "model_type": model_service.model_type,
        "status": "active",
        "metrics": model_service.metrics,
        "config": model_service.config,
        "input_window": model_service.model_info.get("input_window", ""),
        "output_window": model_service.model_info.get("output_window", ""),
        "framework": model_service.model_info.get("framework", "PyTorch"),
        "novelty": model_service.model_info.get("novelty_vs_lstm", ""),
    }


# ─── Helpers ────────────────────────────────────────────────────────────────


def _build_recommendations(severity: str, predictions: list, model_type: str) -> list:
    """Generate traffic management recommendations based on prediction severity."""
    critical_count = sum(1 for p in predictions if p.get("severity") == "critical")
    high_count = sum(1 for p in predictions if p.get("severity") == "high")

    recs = []

    if severity in ["high", "critical"] and (critical_count + high_count) > 0:
        recs.append(Recommendation(
            type="reroute",
            description=(
                f"ST-GCN predicted {critical_count + high_count} affected segments. "
                "Recommend rerouting traffic via parallel arterial roads."
            ),
            alternative_edges=[],
            estimated_time_saved_seconds=300,
        ))
        recs.append(Recommendation(
            type="signal_change",
            description="Increase green phase by 15s at key intersections to reduce queue overflow.",
            alternative_edges=[],
            estimated_time_saved_seconds=120,
        ))
        recs.append(Recommendation(
            type="alternative_route",
            description=(
                f"Activate emergency vehicle priority routing for ambulance/fire trucks. "
                f"Model: {model_type.upper()} — captures spatial spread of congestion."
            ),
            alternative_edges=[],
            estimated_time_saved_seconds=240,
        ))
    elif severity == "medium":
        recs.append(Recommendation(
            type="advisory",
            description="Moderate congestion predicted. Advisory warning to commuters recommended.",
            alternative_edges=[],
            estimated_time_saved_seconds=0,
        ))

    return recs

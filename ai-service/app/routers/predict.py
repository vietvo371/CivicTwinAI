import random
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Prediction"])


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


class PredictResponse(BaseModel):
    incident_id: int
    model_version: str
    predictions: list[EdgePrediction]
    processing_time_ms: int


@router.post("/predict", response_model=PredictResponse)
async def predict_traffic(request: PredictRequest):
    """
    Predict traffic impact for an incident.
    Currently returns mock data — will be replaced by LSTM/GNN model.
    """
    severity_map = {"low": 0.3, "medium": 0.5, "high": 0.7, "critical": 0.9}
    base_density = severity_map.get(request.severity, 0.5)

    predictions = []
    for edge_id in request.affected_edge_ids:
        for horizon in [15, 30, 60]:
            factor = 1.0 + (horizon / 60) * 0.3
            density = min(base_density * factor + random.uniform(-0.05, 0.1), 1.0)
            predictions.append(
                EdgePrediction(
                    edge_id=edge_id,
                    time_horizon_minutes=horizon,
                    predicted_density=round(density, 4),
                    predicted_delay_s=int(density * 300),
                    confidence=round(random.uniform(0.6, 0.95), 2),
                    severity="critical" if density > 0.8 else "high" if density > 0.6 else "medium",
                )
            )

    return PredictResponse(
        incident_id=request.incident_id,
        model_version="mock_v0.1",
        predictions=predictions,
        processing_time_ms=random.randint(50, 200),
    )

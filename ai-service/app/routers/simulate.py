import random
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Simulation"])


class EdgeChange(BaseModel):
    action: str  # add_edge, modify_edge, remove_edge
    edge_id: int | None = None
    source_node_id: int | None = None
    target_node_id: int | None = None
    lanes: int | None = None
    speed_limit_kmh: int | None = None


class SimulateRequest(BaseModel):
    scenario_name: str
    changes: list[EdgeChange]


class MetricComparison(BaseModel):
    metric: str
    baseline: float
    simulated: float
    improvement_pct: float


class SimulateResponse(BaseModel):
    scenario_name: str
    model_version: str
    comparisons: list[MetricComparison]
    processing_time_ms: int


@router.post("/simulate", response_model=SimulateResponse)
async def simulate_scenario(request: SimulateRequest):
    """
    Simulate a traffic scenario with proposed changes.
    Currently returns mock data — will be replaced by simulation engine.
    """
    num_changes = len(request.changes)
    improvement = min(num_changes * 5 + random.uniform(2, 8), 35)

    comparisons = [
        MetricComparison(
            metric="avg_density",
            baseline=round(random.uniform(0.5, 0.7), 4),
            simulated=round(random.uniform(0.3, 0.5), 4),
            improvement_pct=round(improvement + random.uniform(-3, 3), 1),
        ),
        MetricComparison(
            metric="avg_delay_seconds",
            baseline=round(random.uniform(120, 200), 1),
            simulated=round(random.uniform(80, 140), 1),
            improvement_pct=round(improvement + random.uniform(-5, 5), 1),
        ),
        MetricComparison(
            metric="congested_edges_pct",
            baseline=round(random.uniform(30, 50), 1),
            simulated=round(random.uniform(15, 35), 1),
            improvement_pct=round(improvement + random.uniform(-2, 8), 1),
        ),
    ]

    return SimulateResponse(
        scenario_name=request.scenario_name,
        model_version="mock_v0.1",
        comparisons=comparisons,
        processing_time_ms=random.randint(200, 800),
    )

import time
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.graph_service import graph_service

router = APIRouter(tags=["Simulation"])


class SimulateRequest(BaseModel):
    incident_type: str
    severity_level: str
    location_area: str
    prediction_horizon: int


class SegmentResult(BaseModel):
    name: str
    before: float
    after: float
    change: int


class SimulateResponse(BaseModel):
    id: int
    status: str
    duration_ms: int
    affected_edges: int
    before_avg_density: float
    after_avg_density: float
    segments: list[SegmentResult]


@router.post("/simulate", response_model=SimulateResponse)
async def simulate_scenario(request: SimulateRequest):
    """
    Simulate a traffic scenario with proposed changes using BFS cascading.
    """
    start_time = time.time()

    # Goi vao Graph Service de tinh toan What-If
    result = graph_service.simulate_scenario(
        location_area=request.location_area,
        severity=request.severity_level,
        incident_type=request.incident_type,
        prediction_horizon=request.prediction_horizon
    )

    process_time = int((time.time() - start_time) * 1000)

    # Chuyen thanh Format Model
    segments = []
    if result.get("segments"):
        for seg in result["segments"]:
            segments.append(SegmentResult(
                name=seg["name"],
                before=seg["before"],
                after=seg["after"],
                change=seg["change"]
            ))

    return SimulateResponse(
        id=int(time.time()),
        status="completed",
        duration_ms=process_time,
        affected_edges=result.get("affected_edges", 0),
        before_avg_density=result.get("before_avg_density", 0.0),
        after_avg_density=result.get("after_avg_density", 0.0),
        segments=segments,
    )

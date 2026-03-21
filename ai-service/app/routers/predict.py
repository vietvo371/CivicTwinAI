from fastapi import APIRouter
from pydantic import BaseModel
import time
from app.services.graph_service import graph_service

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

class Recommendation(BaseModel):
    type: str
    description: str
    alternative_edges: list[int]
    estimated_time_saved_seconds: int

class PredictResponse(BaseModel):
    incident_id: int
    model_version: str
    predictions: list[EdgePrediction]
    recommendations: list[Recommendation] = []
    processing_time_ms: int

@router.post("/predict", response_model=PredictResponse)
async def predict_traffic(request: PredictRequest):
    """
    Predict traffic impact for an incident using Heuristic BFS network propagation.
    """
    start_time = time.time()
    
    # Lan truyen un tac (cascading) ra xung quanh
    predictions_data = graph_service.predict_cascading_impact(
        incident_edge_ids=request.affected_edge_ids,
        severity=request.severity,
        time_horizons=[15, 30, 60]
    )
    
    predictions = [EdgePrediction(**p) for p in predictions_data]
    
    # Recommendation don gian: Neu un tac rong
    recommendations = []
    if request.severity in ['high', 'critical'] and len(predictions) > 10:
        recommendations.append(Recommendation(
            type="reroute",
            description=f"Ùn tắc phức tạp tại {len(request.affected_edge_ids)} điểm. Đề xuất phân luồng các xe đi vào từ đường liền kề khác.",
            alternative_edges=[],
            estimated_time_saved_seconds=300
        ))
        recommendations.append(Recommendation(
            type="signal_change",
            description="Đề xuất tăng 15s nhịp đèn xanh ở ngã tư thoát tuyến để giảm tải.",
            alternative_edges=[],
            estimated_time_saved_seconds=120
        ))
    elif request.severity in ['medium']:
        recommendations.append(Recommendation(
            type="advisory",
            description="Tình trạng ùn ứ vừa phải. Hệ thống tiếp tục giữ nguyên tín hiệu theo dõi.",
            alternative_edges=[],
            estimated_time_saved_seconds=0
        ))
        
    process_time = int((time.time() - start_time) * 1000)

    return PredictResponse(
        incident_id=request.incident_id,
        model_version="heuristic_bfs_v1.0",
        predictions=predictions,
        recommendations=recommendations,
        processing_time_ms=process_time,
    )

---
description: Workflow xử lý sự cố giao thông. Tạo incident, trigger prediction, generate recommendation, notify operator.
---

# /incident — Xử lý Sự cố Giao thông

## Workflow

### Bước 1: Thu thập thông tin sự cố

Hỏi user hoặc lấy từ context:
- **Loại sự cố**: accident | congestion | road_work | flood | other
- **Mức nghiêm trọng**: low | medium | high | critical
- **Vị trí**: Edge IDs hoặc tên đường
- **Nguồn**: citizen_report | operator | auto_detected

### Bước 2: Tạo Incident trong hệ thống

Sử dụng `traffic-engineer` để validate business logic:
- Incident record hợp lệ?
- Severity đúng theo classification rules?
- Affected edges xác định đúng?

Sử dụng `backend-specialist` để tạo API endpoint/logic:
```
POST /api/incidents
```

### Bước 3: Trigger Prediction

Sử dụng `ai-ml-engineer` để gọi Python AI:
```
POST python-ai:8001/predict
{
  "incident_id": ...,
  "affected_edges": [...],
  "severity": "..."
}
```

### Bước 4: Generate Recommendation

Từ prediction → tạo recommendation:
- Reroute suggestions
- Priority route (nếu emergency)
- Alert cho citizen

Sử dụng `backend-specialist` để lưu recommendation + broadcast.

### Bước 5: Notify Operator

- Push notification qua WebSocket → Frontend
- Operator approve/reject recommendation
- Nếu approved → execute (broadcast changes)

## Agents Involved

| Step | Agent |
|------|-------|
| Validate logic | `traffic-engineer` |
| API + Events | `backend-specialist` |
| AI Prediction | `ai-ml-engineer` |
| Dashboard UI | `frontend-specialist` |

## Expected Output

- Incident created + saved to DB
- Prediction generated with confidence scores
- Recommendations presented to operator
- Realtime update on traffic map

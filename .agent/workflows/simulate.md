---
description: Workflow mô phỏng kịch bản giao thông. Định nghĩa scenario, chạy simulation, so sánh before/after, tạo báo cáo tác động.
---

# /simulate — Mô phỏng Giao thông

## Workflow

### Bước 1: Định nghĩa kịch bản

Hỏi user:
- **Tên kịch bản**: VD: "Mở đường Nguyễn Văn A"
- **Thay đổi**:
  - Thêm node/edge mới (mở đường)
  - Sửa edge (thêm lane, thay đổi speed limit)
  - Xóa/đóng edge (đóng đường sửa chữa)
  - Đổi chiều (một chiều → hai chiều)
- **Thời gian mô phỏng**: VD: 24 giờ, 96 time steps

### Bước 2: Validate kịch bản

Sử dụng `traffic-engineer` để validate:
- Kịch bản hợp logic không? (node/edge tồn tại?)
- Thay đổi có vi phạm constraints nào không?
- Metrics nào cần so sánh?

### Bước 3: Gọi Simulation API

Sử dụng `ai-ml-engineer`:
```
POST python-ai:8001/simulate
{
  "scenario_name": "...",
  "changes": [...],
  "simulation_duration_hours": 24,
  "time_steps": 96
}
```

### Bước 4: Phân tích kết quả

So sánh baseline vs simulated:
- Avg density giảm X%?
- Avg delay giảm Y%?
- Số edge congested giảm Z%?

### Bước 5: Tạo báo cáo

Tạo impact report cho Urban Planner:
- Summary: cải thiện hay xấu đi?
- Chi tiết per-edge changes
- Recommendations

## Agents Involved

| Step | Agent |
|------|-------|
| Validate scenario | `traffic-engineer` |
| Simulation API | `ai-ml-engineer` |
| Backend support | `backend-specialist` |
| Report UI | `frontend-specialist` |

## Expected Output

- Simulation completed
- Before/After comparison table
- Impact report with % improvement
- Visual comparison trên map (optional)

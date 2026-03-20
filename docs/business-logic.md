# Business Logic — CivicTwin AI

> Nghiệp vụ cốt lõi: chuyển đổi từ **phản ứng (reactive)** sang **dự đoán & chủ động (predictive & proactive)**

---

## 0. Tầm nhìn: Reactive → Proactive

### Mô hình truyền thống (Reactive)

```
Sự cố xảy ra → Phát hiện (chậm) → Phản ứng (muộn) → Thiệt hại đã lan rộng
```

Vấn đề: Chỉ hành động **SAU KHI** vấn đề xảy ra. Ùn tắc đã lan rộng, cứu hộ bị kẹt, thiệt hại lớn.

### Mô hình CivicTwin AI (Predictive & Proactive)

```
Dữ liệu realtime → AI dự đoán → Đề xuất chủ động → Can thiệp SỚM → Ngăn thiệt hại
```

### Chuỗi Proactive Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│  MONITOR    │───▶│   DETECT     │───▶│   PREDICT    │───▶│  RECOMMEND   │───▶│   ACT       │
│ Giám sát    │    │ Phát hiện    │    │ Dự đoán      │    │ Đề xuất      │    │ Hành động   │
│ realtime    │    │ chủ động     │    │ tương lai    │    │ tối ưu       │    │ sớm         │
│             │    │              │    │              │    │              │    │             │
│ IoT/Sensor  │    │ Auto-detect  │    │ LSTM/GNN     │    │ Reroute      │    │ Broadcast   │
│ → density   │    │ anomaly      │    │ 15/30/60min  │    │ Priority     │    │ Push alert  │
│ → speed     │    │ density spike│    │ confidence%  │    │ Alert        │    │ Execute     │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └─────────────┘
     │                   │                    │                   │                   │
     ▼                   ▼                    ▼                   ▼                   ▼
 🟢 Luồng 1         🟡 Luồng 2          🔵 Luồng 3         🟠 Luồng 4         🔴 Luồng 5
```

### 4 Giá trị so với Reactive

| Giá trị | Reactive (Cũ) | Proactive (CivicTwin AI) |
|---------|---------------|--------------------------|
| 🚦 **Giảm ùn tắc** | Biết tắc khi đã tắc | Dự đoán trước 15–60 phút, can thiệp sớm |
| 🚑 **Khẩn cấp nhanh** | Tìm đường bằng kinh nghiệm | AI tính tuyến tối ưu tránh tắc |
| 📊 **Quyết định data-driven** | Cảm tính, báo cáo cũ | Realtime data + AI prediction + simulation |
| 💰 **Tiết kiệm chi phí** | Phản ứng chậm → thiệt hại lớn | Can thiệp sớm → ngăn lan rộng |

## 1. Mô hình Mạng Giao thông (Graph Network)

CivicTwinAI mô hình mạng giao thông như **đồ thị có hướng có trọng số** (Weighted Directed Graph):

```
Node (Nút giao)                    Edge (Đoạn đường)
├── Ngã tư (intersection)          ├── Nối 2 nodes
├── Bùng binh (roundabout)         ├── Có chiều dài, số làn, tốc độ giới hạn
├── Nút cao tốc (highway_entry)    ├── Một chiều / hai chiều
├── Cầu (bridge)                   ├── Metrics realtime: density, speed, flow
└── Điểm cuối (terminal)           └── Trạng thái: normal → gridlock
```

---

## 2. Công thức Tính toán Traffic Metrics

### 2.1 Density (Mật độ)

```
density = vehicle_count / (length_m × lanes)

Giá trị: 0.0 (trống) → 1.0 (kẹt cứng)
Cập nhật: Mỗi khi nhận sensor data mới
```

### 2.2 Speed Ratio (Tỷ lệ tốc độ)

```
speed_ratio = current_speed_kmh / speed_limit_kmh

< 0.3 = Ùn tắc nghiêm trọng
> 0.7 = Lưu thông bình thường
```

### 2.3 Flow (Lưu lượng)

```
flow = density × current_speed_kmh

Đơn vị: xe·km/h trên mỗi đơn vị diện tích
Khi density tăng quá mức → speed giảm → flow giảm (paradox)
```

### 2.4 Delay (Thời gian chậm trễ)

```
delay_seconds = (length_m / current_speed_kmh) - (length_m / speed_limit_kmh)

× 3.6 để chuyển km/h → m/s
Ý nghĩa: Mất thêm bao nhiêu giây so với bình thường
```

---

## 3. Congestion Level Classification

Hệ thống tự động phân loại mức tắc nghẽn dựa trên density + speed_ratio:

| Level | Density | Speed Ratio | Màu map | Ý nghĩa |
|-------|---------|-------------|---------|----------|
| **NONE** | < 0.3 | > 0.7 | 🟢 Xanh | Lưu thông tốt |
| **LIGHT** | 0.3 – 0.5 | 0.5 – 0.7 | 🟡 Vàng | Hơi đông |
| **MODERATE** | 0.5 – 0.7 | 0.3 – 0.5 | 🟠 Cam | Chậm rõ rệt |
| **HEAVY** | 0.7 – 0.9 | 0.1 – 0.3 | 🔴 Đỏ | Tắc nghẽn |
| **GRIDLOCK** | > 0.9 | < 0.1 | ⚫ Đỏ đậm | Kẹt cứng |

**Quy tắc xác định:**
```
if density < 0.3 AND speed_ratio > 0.7 → NONE
elif density < 0.5 OR speed_ratio > 0.5 → LIGHT  
elif density < 0.7 OR speed_ratio > 0.3 → MODERATE
elif density < 0.9 OR speed_ratio > 0.1 → HEAVY
else → GRIDLOCK
```

**Ảnh hưởng thời tiết:**
```
if weather = "rain"  → effective_speed_limit × 0.8  (giảm 20%)
if weather = "storm" → effective_speed_limit × 0.6  (giảm 40%)
if weather = "fog"   → effective_speed_limit × 0.7  (giảm 30%)
```

---

## 4. Năm Luồng Nghiệp vụ Chính

### Luồng 1: Thu thập & Cập nhật Realtime

**Trigger:** Sensor gửi data mỗi 10–60 giây

```
┌─────────────┐     ┌──────────┐     ┌──────────────────┐
│ IoT Sensor  │────▶│  MQTT /  │────▶│  Kafka Topic     │
│ Camera/Radar│     │  HTTP    │     │ traffic.sensor   │
└─────────────┘     └──────────┘     └────────┬─────────┘
                                              │
                                    ┌─────────▼──────────┐
                                    │  Laravel Consumer   │
                                    │  ┌────────────────┐ │
                                    │  │ 1. Validate    │ │
                                    │  │ 2. Deduplicate │ │
                                    │  │ 3. Enrich      │ │
                                    │  │ 4. Anomaly     │ │
                                    │  │    check       │ │
                                    │  │ 5. Calculate   │ │
                                    │  │    metrics     │ │
                                    │  │ 6. Auto-detect │ │
                                    │  └───────┬────────┘ │
                                    └──────────┼──────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                   ┌──────────────┐   ┌──────────────┐   ┌───────────┐
                   │ Update DB    │   │ Broadcast    │   │ Check     │
                   │ edge metrics │   │ WebSocket    │   │ auto-     │
                   │ + readings   │   │ → Dashboard  │   │ detect    │
                   └──────────────┘   └──────────────┘   └───────────┘
```

**Business Rules:**

| Step | Rule | Hành động khi vi phạm |
|------|------|----------------------|
| Validate | speed ≥ 0, count ≥ 0, speed ≤ 200 | Reject, log warning |
| Deduplicate | Kiểm tra `message_id` đã xử lý | Skip, không process lại |
| Enrich | Gắn `edge_id` từ `sensor_id` | Reject nếu sensor không tồn tại |
| Anomaly | Giá trị thay đổi > 50% trong 1 phút | Flag `is_anomaly = true`, vẫn process |
| Sensor offline | Không nhận data > 3 phút | Mark sensor `offline`, giảm confidence |

---

### Luồng 2: Phát hiện & Xử lý Sự cố (Incident)

**3 nguồn tạo sự cố:**

```
┌─────────────────┐
│ 1. Auto-detect  │── density tăng > 0.3 trong 5 phút
│    (Hệ thống)   │── speed giảm > 50%
├─────────────────┤
│ 2. Operator     │── Tạo thủ công từ dashboard
│    (Thủ công)    │── Chọn vị trí + edges trên map
├─────────────────┤
│ 3. Citizen      │── Báo cáo qua mobile app
│    (Người dân)   │── Gửi ảnh + GPS location
└─────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│              INCIDENT CREATED            │
│  Event: IncidentCreated                  │
├─────────────────────────────────────────┤
│  1. Lưu vào DB (status = 'open')        │
│  2. Xác định affected_edge_ids          │
│  3. Classify severity (auto)            │
│  4. Dispatch Job: CallAIPrediction      │
│  5. Notify assigned operator            │
│  6. Broadcast → Dashboard map           │
└─────────────────────────────────────────┘
```

**Auto-detection Rules:**

```
Rule 1: Density Spike
  IF edge.density tăng > 0.3 trong 5 phút
  AND edge.speed giảm > 50%
  → Tạo incident (type=congestion, source=auto_detected)

Rule 2: Speed Drop
  IF edge.current_speed < 5 km/h
  AND edge.current_density > 0.8
  AND kéo dài > 3 phút
  → Tạo incident (type=congestion, severity=high)

Rule 3: Sensor Anomaly Cluster
  IF ≥ 3 sensors trên cùng khu vực ghi nhận anomaly cùng lúc
  → Tạo incident (type=other, source=auto_detected)
  → Flag cho operator review
```

---

### Luồng 3: Dự đoán AI (Prediction)

**Trigger:** Incident created → Job gọi Python AI

```
┌──────────────────────────────────────────────┐
│               PREDICTION FLOW                 │
├──────────────────────────────────────────────┤
│                                              │
│  Laravel                    Python AI        │
│  ┌──────────┐              ┌──────────┐     │
│  │CallAI    │  HTTP POST   │/predict  │     │
│  │Prediction│─────────────▶│          │     │
│  │Job       │  {           │ 1. Load  │     │
│  │          │   incident,  │    graph  │     │
│  │          │   edges,     │ 2. LSTM   │     │
│  │          │   severity   │    predict│     │
│  │          │  }           │ 3. GNN    │     │
│  │          │              │    spread │     │
│  │          │◀─────────────│ 4. Score  │     │
│  │          │  predictions │    conf.  │     │
│  └────┬─────┘              └──────────┘     │
│       │                                      │
│       ▼                                      │
│  Save predictions → DB                       │
│  Event: PredictionReceived                   │
│  → GenerateRecommendation                    │
│  → BroadcastToFrontend                       │
│  → NotifyOperator                            │
└──────────────────────────────────────────────┘
```

**Prediction Output per Edge:**

| Field | Ý nghĩa | Ví dụ |
|-------|---------|-------|
| `edge_id` | Edge nào bị ảnh hưởng | 48 |
| `time_horizon_minutes` | Dự đoán sau bao lâu | 15, 30, 60 |
| `predicted_density` | Mật độ dự đoán | 0.85 |
| `predicted_delay_s` | Thời gian chậm trễ (giây) | 180 |
| `confidence` | Độ tin cậy | 0.78 |
| `severity` | Mức nghiêm trọng | high |

**Confidence Score Calculation:**

```
confidence = base_confidence × recency_factor × data_quality_factor

base_confidence:      Model accuracy từ validation set (MAE, RMSE)
recency_factor:       1.0 nếu data < 5 phút, giảm 0.05/phút sau đó
data_quality_factor:  avg(data_quality) của sensors trên edge
                      Nếu sensor offline → factor = 0.3

Ví dụ: 0.82 × 0.95 × 0.90 = 0.70 (confidence = 70%)
```

**Fallback khi AI Service lỗi:**

| Tình huống | Action |
|------------|--------|
| AI timeout > 5s | Dùng cached prediction gần nhất |
| AI service down | Rule-based: if density > 0.7 → predict congestion sẽ lan rộng |
| Không đủ data | Trả confidence = 0.0 kèm warning |
| Model lỗi | Log error, notify admin, không tạo prediction |

---

### Luồng 4: Đề xuất & Ra quyết định (Recommendation)

**Trigger:** Prediction completed → Generate recommendation

```
Prediction Results
        │
        ▼
┌───────────────────────────────────────────────┐
│          RECOMMENDATION ENGINE                 │
│                                                │
│  Input: predictions[]                          │
│  ┌─────────────────────────────────────┐      │
│  │ Filter: severity >= medium          │      │
│  │ AND confidence >= 0.5               │      │
│  └──────────────┬──────────────────────┘      │
│                 │                              │
│  ┌──────────────▼──────────────────────┐      │
│  │ Type Selection:                     │      │
│  │                                     │      │
│  │ IF incident.severity = CRITICAL     │      │
│  │   → priority_route + alert          │      │
│  │                                     │      │
│  │ IF incident.severity = HIGH         │      │
│  │   → reroute + alert                 │      │
│  │                                     │      │
│  │ IF incident.severity = MEDIUM       │      │
│  │   → reroute (suggestion only)       │      │
│  │                                     │      │
│  │ IF incident.severity = LOW          │      │
│  │   → monitor only (no recommendation)│      │
│  └──────────────┬──────────────────────┘      │
│                 │                              │
│                 ▼                              │
│  Save recommendation (status = 'pending')     │
│  Notify operator → Dashboard                  │
└───────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────┐
│   OPERATOR DECISION       │
│                           │
│  ┌─────────┐  ┌────────┐ │
│  │ APPROVE │  │ REJECT │ │
│  └────┬────┘  └───┬────┘ │
│       │           │      │
│       ▼           ▼      │
│  Execute:    Log reason   │
│  - Broadcast  (audit)    │
│    reroute               │
│  - Push alert            │
│    to citizen            │
│  - Update                │
│    traffic               │
│    signals               │
└───────────────────────────┘
```

**4 loại Recommendation:**

| Type | Điều kiện | Nội dung |
|------|-----------|----------|
| **reroute** | Edges bị tắc, có đường thay thế | alternative_edges[], estimated_time_saved_s |
| **priority_route** | Emergency request hoặc severity=CRITICAL | from_node → to_node, route_edges[] |
| **alert** | Cần cảnh báo citizen | message, target_zones[], channels[] |
| **signal_control** | Có thể thay đổi đèn (tương lai) | intersection_id, suggested_timing |

---

### Luồng 5: Mô phỏng Quy hoạch (Simulation)

**Trigger:** Urban Planner tạo scenario

```
┌────────────────────────────────────────────────────┐
│                 SIMULATION FLOW                     │
├────────────────────────────────────────────────────┤
│                                                    │
│  Step 1: Define Scenario                           │
│  ┌──────────────────────────────────────┐         │
│  │ changes = [                          │         │
│  │   { action: "add_edge",      ... },  │         │
│  │   { action: "modify_edge",   ... },  │         │
│  │   { action: "remove_edge",   ... },  │         │
│  │   { action: "modify_node",   ... }   │         │
│  │ ]                                    │         │
│  └──────────────────────────────────────┘         │
│                                                    │
│  Step 2: Validate                                  │
│  ┌──────────────────────────────────────┐         │
│  │ - Nodes tồn tại?                    │         │
│  │ - Edges hợp lệ (source ≠ target)?   │         │
│  │ - Graph vẫn connected sau thay đổi? │         │
│  └──────────────────────────────────────┘         │
│                                                    │
│  Step 3: Run Simulation (Python)                   │
│  ┌──────────────────────────────────────┐         │
│  │ - Clone graph hiện tại               │         │
│  │ - Apply changes                      │         │
│  │ - Simulate 24h traffic patterns      │         │
│  │ - Calculate metrics tại mỗi timestep │         │
│  └──────────────────────────────────────┘         │
│                                                    │
│  Step 4: Compare                                   │
│  ┌──────────────────────────────────────┐         │
│  │ Baseline      vs    Simulated        │         │
│  │ avg_density         avg_density      │         │
│  │ avg_delay           avg_delay        │         │
│  │ congested_edges     congested_edges  │         │
│  │                                      │         │
│  │ → improvement_pct for each metric    │         │
│  └──────────────────────────────────────┘         │
│                                                    │
│  Step 5: Impact Report                             │
│  ┌──────────────────────────────────────┐         │
│  │ - Density giảm X%                    │         │
│  │ - Delay giảm Y%                      │         │
│  │ - Congested edges giảm Z%            │         │
│  │ - Top 5 edges improved               │         │
│  │ - Top 5 edges worsened               │         │
│  └──────────────────────────────────────┘         │
└────────────────────────────────────────────────────┘
```

---

## 5. Incident Severity Logic

### Classification Rules

| Level | Điều kiện | Auto/Manual | Phản ứng hệ thống |
|-------|-----------|-------------|-------------------|
| **LOW** | Va chạm nhỏ, 1 lane blocked, density < 0.5 | Manual | Thông báo operator |
| **MEDIUM** | Tai nạn, 2+ lanes blocked, density 0.5–0.7 | Cả hai | Predict + recommend reroute |
| **HIGH** | Tai nạn nghiêm trọng, đường blocked, density > 0.7 | Cả hai | Auto-predict + urgent notification |
| **CRITICAL** | Thiên tai, ngập, sập cầu, đường hoàn toàn blocked | Manual | Emergency mode + priority route + alert all citizens |

### Auto-escalation Rules

```
IF incident severity = LOW
  AND after 30 minutes density trên affected edges > 0.7
  → Escalate to MEDIUM (auto)
  → Trigger new prediction

IF incident severity = MEDIUM
  AND prediction shows congestion spreading to > 5 edges
  AND confidence > 0.6
  → Escalate to HIGH (auto)
  → Urgent notification to all operators

IF incident severity = HIGH
  AND no operator response within 10 minutes
  → Alert City Admin
  → Auto-create priority route recommendation
```

### Incident Lifecycle

```
OPEN → INVESTIGATING → RESOLVED → CLOSED

┌──────┐   Operator     ┌──────────────┐   Operator    ┌──────────┐   Auto/Manual  ┌────────┐
│ OPEN │──────────────▶│INVESTIGATING │────────────▶│ RESOLVED │──────────────▶│ CLOSED │
└──────┘   picks up     └──────────────┘   confirms    └──────────┘   after 24h    └────────┘
                              │                             │
                              │ Re-open if                  │
                              │ density spikes again        │
                              ◄─────────────────────────────┘
```

---

## 6. Priority Route Logic

Khi Emergency Services yêu cầu tuyến ưu tiên:

```
Input: from_node (vị trí hiện tại), to_node (đích)

Step 1: Dijkstra shortest path trên graph
   weight = length_m / current_speed_kmh  (thời gian travel)

Step 2: Filter tuyến
   Loại bỏ edges: status = 'closed' hoặc 'blocked'

Step 3: Kiểm tra congestion
   IF any edge on route có density > 0.7:
      → Tìm alternative route (tránh edge đó)
      → So sánh: alternative faster? → Chọn alternative

Step 4: Nếu tất cả routes đều congested:
   → Đề xuất "can thiệp": thông báo các xe phía trước dạt sang
   → Broadcast tuyến ưu tiên lên map → vehicles thấy và tránh

Step 5: Output
   - route_edges: [10, 11, 12, 15]
   - estimated_time_minutes: 8
   - Broadcast trên map (hiển thị route + icon emergency)
```

---

## 7. Notification Logic

### Khi nào gửi notification

| Event | Recipients | Channel | Priority |
|-------|-----------|---------|----------|
| Incident CRITICAL | All operators + Admin | Push + WebSocket | 🔴 Urgent |
| Incident HIGH | Assigned operator + Admin | Push + WebSocket | 🟠 High |
| Incident MEDIUM | Assigned operator | WebSocket | 🟡 Normal |
| Prediction ready | Assigned operator | WebSocket | 🟡 Normal |
| Recommendation pending | Operators with permission | WebSocket | 🟡 Normal |
| Recommendation approved | Affected citizens (by zone) | Push | 🟢 Info |
| Sensor offline > 10 min | Admin | Push | 🟠 High |
| AI Service down | Admin | Push + Email | 🔴 Urgent |

### Push Notification cho Citizen (Phase 2)

```
Trigger: Recommendation approved (type = alert)
Filter:  Citizens trong target_zones
Content: {
  title: "⚠️ Cảnh báo giao thông",
  body: "Ùn tắc nghiêm trọng trên Điện Biên Phủ. Vui lòng chọn đường khác.",
  data: { incident_id, affected_edges, alternative_routes }
}
```

---

## 8. Edge Status State Machine

```
                    sensor data OK
           ┌────────────────────────────┐
           │                            │
           ▼                            │
       ┌────────┐   density > 0.7   ┌───┴──────┐
       │ NORMAL │──────────────────▶│CONGESTED │
       └───┬────┘                   └────┬─────┘
           │                             │
    incident│created                incident│resolved
    (blocked)│                      density drops
           │                             │
           ▼                             ▼
       ┌────────┐   incident         ┌────────┐
       │BLOCKED │   resolved         │ NORMAL │
       └───┬────┘──────────────────▶└────────┘
           │
    admin closes road
           │
           ▼
       ┌────────┐   admin re-opens
       │ CLOSED │──────────────────▶ NORMAL
       └────────┘
```

**Transition Rules:**
- `NORMAL → CONGESTED`: Tự động khi density > 0.7 AND speed_ratio < 0.3
- `CONGESTED → NORMAL`: Tự động khi density < 0.5 AND speed_ratio > 0.5
- `NORMAL/CONGESTED → BLOCKED`: Khi incident xác nhận đường bị blocked
- `BLOCKED → NORMAL`: Operator resolve incident
- `* → CLOSED`: Admin đóng đường thủ công
- `CLOSED → NORMAL`: Admin mở lại

---

## 9. Activity Logging Rules

### Những hành động PHẢI log

| Action | Log Name | Description |
|--------|----------|-------------|
| Incident created | incident | "Created incident #{id}: {title}" |
| Incident status changed | incident | "Updated status: {old} → {new}" |
| Incident severity changed | incident | "Escalated severity: {old} → {new}" |
| Incident assigned | incident | "Assigned to operator #{user_id}" |
| Recommendation approved | recommendation | "Approved recommendation #{id}" |
| Recommendation rejected | recommendation | "Rejected: {reason}" |
| Recommendation executed | recommendation | "Executed reroute/alert/priority" |
| User role changed | user | "Role changed: {old_roles} → {new_roles}" |
| Sensor status changed | sensor | "Sensor {code}: {old_status} → {new_status}" |
| Edge manually closed/opened | edge | "Edge #{id} {action} by admin" |
| Simulation run | simulation | "Ran simulation: {scenario_name}" |

### Log format (Laravel Activity Log)

```json
{
  "log_name": "incident",
  "description": "updated",
  "subject_type": "App\\Models\\Incident",
  "subject_id": 42,
  "causer_id": 5,
  "event": "updated",
  "properties": {
    "old": { "status": "open", "severity": "medium" },
    "new": { "status": "investigating", "severity": "high" }
  }
}
```

---

## 10. Tóm tắt Logic chính

| # | Logic | Input | Output | Trigger |
|---|-------|-------|--------|---------|
| 1 | Tính metrics | Sensor data | density, speed, flow, congestion_level | Mỗi 10-60s |
| 2 | Auto-detect | Density spike / speed drop | New incident | Realtime check |
| 3 | Prediction | Incident + graph | predicted density/delay per edge | Incident created |
| 4 | Recommendation | Prediction results | reroute / priority / alert | Prediction done |
| 5 | Escalation | Time + density change | Severity upgrade | Periodic check |
| 6 | Priority route | From/To nodes | Optimal route avoiding congestion | Emergency request |
| 7 | Simulation | Scenario changes | Before/After comparison | Planner request |
| 8 | Notification | System events | Push / WebSocket / Email | Event-driven |

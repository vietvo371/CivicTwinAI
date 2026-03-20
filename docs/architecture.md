# Kiến trúc Hệ thống CivicTwin AI

> Chuyển đổi quản lý giao thông đô thị từ **phản ứng (reactive)** sang **dự đoán & chủ động (predictive & proactive)**

---

## 1. Tổng quan

### Tầm nhìn

CivicTwin AI là hệ thống Digital Twin xây dựng **bản sao số** của mạng giao thông đô thị, chuyển đổi cách vận hành từ mô hình **"phản ứng"** truyền thống sang mô hình **"dự đoán và chủ động"**:

```
╔══════════════════════════════════════════════════════════════════╗
║                    MÔ HÌNH CHUYỂN ĐỔI                           ║
╠════════════════════════════╦═════════════════════════════════════╣
║   REACTIVE (Truyền thống)  ║   PROACTIVE (CivicTwin AI)         ║
╠════════════════════════════╬═════════════════════════════════════╣
║ Phát hiện ùn tắc khi      ║ Dự đoán ùn tắc 15–60 phút trước   ║
║ đã xảy ra                 ║ → đề xuất chuyển hướng sớm         ║
╠════════════════════════════╬═════════════════════════════════════╣
║ Tìm đường cứu hộ          ║ AI tính tuyến ưu tiên tối ưu       ║
║ bằng kinh nghiệm          ║ → tránh tắc, nhanh nhất            ║
╠════════════════════════════╬═════════════════════════════════════╣
║ Quyết định dựa trên       ║ Quyết định dựa trên dữ liệu       ║
║ cảm tính, báo cáo cũ      ║ realtime + mô phỏng tác động       ║
╠════════════════════════════╬═════════════════════════════════════╣
║ Phản ứng chậm → tắc lan   ║ Can thiệp sớm → ngăn lan rộng     ║
║ rộng → thiệt hại lớn      ║ → tiết kiệm thời gian & chi phí   ║
╚════════════════════════════╩═════════════════════════════════════╝
```

### 4 Giá trị Cốt lõi

| # | Giá trị | Cách đạt được |
|---|---------|---------------|
| 🚦 | **Giảm ùn tắc giao thông** | AI dự đoán tắc nghẽn lan rộng → đề xuất chuyển hướng TRƯỚC KHI tắc |
| 🚑 | **Tăng tốc xử lý khẩn cấp** | Tuyến ưu tiên tối ưu cho cứu hộ, tránh đoạn tắc bằng graph algorithm |
| 📊 | **Ra quyết định dựa trên dữ liệu** | Dashboard realtime + prediction + simulation → không còn cảm tính |
| 💰 | **Tiết kiệm thời gian & chi phí** | Phát hiện sớm, can thiệp nhanh → giảm thiệt hại do tắc nghẽn |

### Hệ thống bao gồm

- **Giám sát realtime**: Mật độ, tốc độ, lưu lượng xe trên từng đoạn đường qua IoT/sensor
- **Phát hiện sự cố chủ động**: Tự động phát hiện ùn tắc bất thường, tai nạn bằng anomaly detection
- **Dự đoán thông minh**: AI (LSTM/GNN) dự đoán tắc nghẽn lan rộng 15–60 phút tới
- **Đề xuất hành động**: Gợi ý chuyển hướng, tuyến ưu tiên cứu hộ, cảnh báo người dân
- **Mô phỏng quy hoạch**: So sánh trước/sau khi thay đổi hạ tầng → ra quyết định dựa trên dữ liệu

---

## 2. Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│         Next.js 15 + Mapbox GL JS + Tailwind            │
│         (Dashboard, Map, Charts, WebSocket)             │
├─────────────────────────────────────────────────────────┤
│                      MOBILE                              │
│               React Native CLI                           │
│    (Citizen App + Emergency Services App)               │
├─────────────────────────────────────────────────────────┤
│                       API                                │
│              Laravel 11+ (PHP 8.3)                       │
│   REST API + Events + Queue + WebSocket Broadcasting    │
├─────────────┬───────────────────────────┬───────────────┤
│  AI SERVICE │     DATA LAYER            │   MESSAGING   │
│ Python      │ PostgreSQL 16 + PostGIS   │ Kafka + MQTT  │
│ FastAPI     │ Redis 7 (Cache/Queue)     │ Soketi (WS)   │
│ LSTM / GNN  │                           │               │
└─────────────┴───────────────────────────┴───────────────┘
```

| Component | Công nghệ | Port | Vai trò |
|-----------|-----------|------|---------|
| Frontend | Next.js 15 + Mapbox | 3000 | Dashboard operator + admin |
| Mobile | React Native CLI | — | Citizen + Emergency app |
| Backend | Laravel 11+ | 8000 | REST API, events, queue |
| AI Service | Python FastAPI | 8001 | Prediction, simulation |
| Database | PostgreSQL 16 + PostGIS | 5432 | Dữ liệu chính + spatial |
| Cache | Redis 7 | 6379 | Cache + queue broker |
| Message Broker | Kafka | 9092 | IoT data ingestion |
| MQTT | Mosquitto | 1883 | Sensor protocol |
| WebSocket | Soketi | 6001 | Realtime broadcasting |

---

## 3. Kiến trúc Hệ thống

### 3.1 Sơ đồ tổng quan

```
                    ┌─────────────┐    ┌─────────────┐
                    │  Next.js 15 │    │React Native │
                    │  Dashboard  │    │  Mobile App │
                    └──────┬──────┘    └──────┬──────┘
                           │                  │
                      WebSocket          REST API
                      + REST API              │
                           │                  │
                    ┌──────┴──────────────────┴──────┐
                    │         Laravel 11+             │
                    │   ┌──────────────────────┐      │
                    │   │  REST API Controllers │      │
                    │   ├──────────────────────┤      │
                    │   │  Events + Listeners   │      │
                    │   ├──────────────────────┤      │
                    │   │  Queue Jobs           │←────── Redis Queue
                    │   ├──────────────────────┤      │
                    │   │  Kafka Consumer       │←────── Kafka
                    │   └──────────────────────┘      │
                    └──────────┬───────────────┬──────┘
                               │               │
                    ┌──────────┴──┐    ┌───────┴────────┐
                    │ PostgreSQL  │    │  Python FastAPI │
                    │  + PostGIS  │    │  AI Service     │
                    │             │    │  LSTM / GNN     │
                    └─────────────┘    └────────────────┘


    ┌─────────────┐     ┌───────┐     ┌─────────────┐
    │ IoT Sensors │────▶│ MQTT  │────▶│   Kafka      │
    │ Camera/Radar│     │Broker │     │   Broker     │
    └─────────────┘     └───────┘     └──────┬───────┘
                                             │
                                    Laravel Consumer
```

### 3.2 Data Flow — 5 Luồng chính

#### Luồng 1: Thu thập & Cập nhật Realtime

```
Sensor → MQTT → Kafka → Laravel Consumer
    → Validate & Enrich data
    → Tính density/speed/flow
    → Cập nhật edge trong PostgreSQL
    → Broadcast qua WebSocket (Soketi)
    → Dashboard map tự động cập nhật
```

#### Luồng 2: Phát hiện & Xử lý Sự cố

```
Sự cố phát hiện bởi:
├── Auto-detect (density spike + speed drop)
├── Citizen report (qua mobile app)
└── Operator tạo thủ công (qua dashboard)

→ Event: IncidentCreated
    → Job: CallAIPrediction (queue)
    → Python AI predict impact
    → Event: PredictionReceived
        → GenerateRecommendation
        → BroadcastToFrontend
        → NotifyOperator
```

#### Luồng 3: Dự đoán AI

```
Laravel POST /predict → Python FastAPI
    → Load graph snapshot + incident data
    → LSTM: dự đoán density/speed 15/30/60 phút
    → GNN: dự đoán lan truyền trên graph
    → Trả về predictions + confidence scores
```

#### Luồng 4: Đề xuất Hành động

```
Prediction → Generate Recommendation:
├── Reroute: tuyến thay thế qua edges ít tắc
├── Priority Route: tuyến ngắn nhất cho cứu hộ
├── Alert: cảnh báo citizen qua push notification
└── Signal Control: đề xuất thay đổi đèn (tương lai)

→ Operator approve/reject trên dashboard
→ Approved → Execute (broadcast, push)
```

#### Luồng 5: Mô phỏng Quy hoạch

```
Urban Planner định nghĩa scenario:
├── Thêm/xóa/sửa node/edge
├── Thay đổi lanes, speed_limit
└── Đổi chiều đường

→ POST /simulate → Python Simulation Engine
→ Baseline vs Simulated comparison
→ Impact report: % cải thiện density, delay, congestion
```

---

## 4. Actors & Quyền hạn

| Actor | Phase | Vai trò | Quyền hạn |
|-------|-------|---------|-----------|
| **City Admin** | 1 | Quản trị toàn bộ | Full access, cấu hình hệ thống |
| **Traffic Operator** | 1 | Giám sát & xử lý sự cố | Xem map, CRUD incident, approve recommendation |
| **Urban Planner** | 1 | Mô phỏng quy hoạch | Chạy simulation, xem báo cáo |
| **Citizen** | 2 | Báo cáo sự cố, nhận cảnh báo | Tạo report, xem cảnh báo (mobile) |
| **Emergency Services** | 2 | Cứu hộ khẩn cấp | Request priority route (mobile) |
| **AI Engine** | — | Dự đoán / mô phỏng | Internal API (không UI) |

---

## 5. Mô hình Mạng Giao thông (Graph)

CivicTwinAI mô hình mạng giao thông như **đồ thị có hướng có trọng số**:

- **Node** = Ngã tư, bùng binh, cầu, nút giao
- **Edge** = Đoạn đường nối 2 node, có thuộc tính tĩnh (lanes, speed_limit) và realtime (density, speed)

### Các chỉ số Giao thông

| Metric | Công thức | Ý nghĩa |
|--------|-----------|----------|
| **Density** | `vehicle_count / (length × lanes)` | 0.0 = trống → 1.0 = kẹt |
| **Speed Ratio** | `current_speed / speed_limit` | < 0.3 = tắc nghiêm trọng |
| **Flow** | `density × current_speed` | Lưu lượng thực tế |
| **Delay** | `(length/speed) - (length/limit)` | Thời gian chậm (giây) |

### Phân loại Mức Tắc nghẽn

| Level | Density | Speed Ratio | Màu |
|-------|---------|-------------|-----|
| **NONE** | < 0.3 | > 0.7 | 🟢 Xanh |
| **LIGHT** | 0.3 – 0.5 | 0.5 – 0.7 | 🟡 Vàng |
| **MODERATE** | 0.5 – 0.7 | 0.3 – 0.5 | 🟠 Cam |
| **HEAVY** | 0.7 – 0.9 | 0.1 – 0.3 | 🔴 Đỏ |
| **GRIDLOCK** | > 0.9 | < 0.1 | ⚫ Đỏ đậm |

---

## 6. Incident Severity

| Level | Điều kiện | Phản ứng hệ thống |
|-------|-----------|-------------------|
| **LOW** | Va chạm nhỏ, 1 lane blocked | Thông báo operator |
| **MEDIUM** | Tai nạn, 2+ lanes blocked | Predict + recommend reroute |
| **HIGH** | Tai nạn nghiêm trọng, đường blocked | Auto-predict + urgent alert |
| **CRITICAL** | Thiên tai, ngập, sập cầu | Emergency mode + priority route + alert all |

---

## 7. Deployment

### Development (Docker Compose)

```bash
docker compose up -d
```

9 services: Laravel, Worker, Python AI, Next.js, PostgreSQL+PostGIS, Redis, Kafka+Zookeeper, Soketi, Mosquitto.

### Production Architecture (tương lai)

```
Load Balancer → Laravel (multiple instances)
             → Next.js (Vercel / container)
             → Python AI (GPU server)
             → PostgreSQL (managed: AWS RDS / Supabase)
             → Redis (managed: Upstash / ElastiCache)
             → Kafka (managed: Confluent Cloud)
```

---

## 8. Phased Delivery

| Phase | Scope | Actors |
|-------|-------|--------|
| **Phase 1** | Backend API + Dashboard + Map + Incident + Prediction | City Admin, Traffic Operator |
| **Phase 2** | Mobile app + Push notification + Priority route | Citizen, Emergency Services |
| **Phase 3** | Simulation module + Long-term planning | Urban Planner |

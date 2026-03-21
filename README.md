# CivicTwin AI — Digital Twin Platform for Smart Urban Traffic

> **CivicTwin AI** là nền tảng **Digital Twin (Bản sao số)** của thành phố, kết hợp **Trí tuệ nhân tạo (AI)** để **mô phỏng, phân tích và dự đoán** hoạt động của hệ thống giao thông & hạ tầng đô thị trong môi trường số.

---

## Digital Twin là gì?

**Digital Twin** = Tạo ra một **bản sao ảo (virtual replica)** của hệ thống giao thông thực tế — đường sá, giao lộ, camera, cảm biến, phương tiện — trong môi trường máy tính. Mọi thay đổi ngoài đời thực được cập nhật **realtime** vào bản sao số, cho phép:

- **Giám sát realtime**: Biết ngay đoạn đường nào đang kẹt, sự cố ở đâu
- **Dự đoán trước**: AI phân tích lan truyền kẹt xe trước 15–120 phút
- **Mô phỏng kịch bản (What-if)**: "Nếu có tai nạn ở Cầu Sài Gòn thì ảnh hưởng thế nào?" — chạy giả lập để biết trước
- **Ra quyết định thông minh**: AI đề xuất giải pháp → Operator chỉ cần Approve/Reject
- **Ứng cứu khẩn cấp**: Tự động tính toán tuyến đường ưu tiên + clear đèn tín hiệu cho xe cấp cứu

---

## AI Engine

CivicTwin AI sử dụng 3 phương pháp AI chuyên biệt:

| Model | Công nghệ | Chức năng |
|-------|-----------|-----------|
| **LSTM Networks** | Long Short-Term Memory | Dự đoán mật độ giao thông theo chuỗi thời gian (time series) |
| **Graph Neural Networks (GNN)** | Spatial Graph Processing | Phân tích lan truyền kẹt xe qua mạng lưới đường (graph topology) |
| **Reinforcement Learning** | Decision Optimization | Tối ưu hóa thời gian đèn tín hiệu realtime |

---

## Tech Stack

| Service | Công nghệ | Port |
|---------|-----------|------|
| **Frontend** | Next.js 15 + Tailwind CSS + Mapbox GL JS | 3000 |
| **Backend** | Laravel 11+ (PHP 8.3) + Sanctum Auth | 8000 |
| **AI Service** | Python FastAPI (LSTM / GNN) | 8001 |
| **Mobile** | React Native CLI | — |
| **Database** | PostgreSQL 16 + PostGIS | 5432 |
| **Cache** | Redis 7 | 6379 |
| **Message Broker** | Apache Kafka | 9092 |
| **WebSocket** | Soketi (Pusher-compatible) | 6001 |
| **MQTT** | Mosquitto (IoT Sensors) | 1883 |

---

## Actors (Tác nhân)

| # | Actor | Role | Giao diện | Chức năng chính |
|---|-------|------|-----------|-----------------|
| 1 | **Super Admin** | `super_admin` | Admin Panel | Quản trị toàn bộ hệ thống, users, settings, system logs |
| 2 | **City Admin** | `city_admin` | Admin Panel + Operator Dashboard | Quản lý dữ liệu nền (Nodes/Edges/Sensors), cấu hình AI |
| 3 | **Traffic Operator** | `traffic_operator` | Operator Command Center | Giám sát giao thông realtime, xử lý sự cố, approve AI recommendations |
| 4 | **Urban Planner** | `urban_planner` | Operator Dashboard (read-only) | Xem analytics, chạy simulation, lập kế hoạch quy hoạch |
| 5 | **Emergency Services** | `emergency` | Emergency Console | Xem sự cố khẩn cấp, dispatch lực lượng, request tuyến ưu tiên |
| 6 | **Citizen** | `citizen` | Citizen Portal (Web + Mobile) | Xem bản đồ giao thông, báo cáo sự cố, nhận cảnh báo |

---

## Cấu trúc dự án

```
CivicTwinAI/
├── backend/          # Laravel API + Queue + Events + Sanctum Auth
├── frontend/         # Next.js 15 Dashboard + Citizen Portal + Mapbox
├── mobile/           # React Native CLI (Citizen + Emergency)
├── ai-service/       # Python FastAPI (Prediction + Simulation)
├── design-system/    # Shared design tokens & components
├── docs/             # Tài liệu dự án
├── docker/           # Docker configs per service
├── .agent/           # AI Agent configuration (Gemini)
├── docker-compose.yml
└── .env.example
```

## Frontend Pages (Next.js App Router)

### Citizen Portal `/map` `/my-reports` `/alerts` `/profile`
- Bản đồ giao thông realtime (Mapbox) với Search, GPS, Sidebar sự cố
- Form báo cáo sự cố + lịch sử reports + cảnh báo khu vực + hồ sơ cá nhân

### Operator Command Center `/dashboard/*`
- Dashboard Overview (KPI cards + Mini Map + Recent Incidents + AI Feed)
- Incidents Management (CRUD + Filter) | AI Predictions (Master-Detail)
- Traffic Simulation (What-if) | Recommendations (Approve/Reject)
- CCTV Monitor (Grid 3x3) | Analytics (Charts + Reports)

### Admin Panel `/admin/*`
- Users Management (CRUD + Role assignment cho 6 roles)
- Master Data (Nodes / Edges / Sensors — graph topology)
- System Settings (General, AI Engine, Notifications, Data Retention)
- System Logs (Audit trail với search + filter)

### Emergency Console `/emergency/*`
- Situation Map (live map focus vào sự cố khẩn cấp)
- Active Incidents (Casualties, Vehicles, Responders + Dispatch/Backup)
- Priority Route (Request đường ưu tiên + ETA + Signal Clearing)

---

## Khởi chạy

### Prerequisites

- Docker Desktop
- Node.js 20+
- PHP 8.3+ & Composer
- Python 3.11+

### Quick Start

```bash
# 1. Clone & setup environment
cp .env.example .env

# 2. Start infrastructure (DB, Redis, Kafka, Soketi)
docker compose up -d postgres redis kafka zookeeper soketi mosquitto

# 3. Start backend
cd backend && composer install && php artisan migrate --seed && php artisan serve

# 4. Start frontend
cd frontend && yarn install && yarn dev

# 5. Start AI service
cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --port 8001
```

### Full Stack (Docker)

```bash
docker compose up -d
```

---

## Luồng nghiệp vụ chính

```
Citizen báo sự cố
    → Backend lưu DB (PostGIS)
    → AI auto-trigger prediction (GNN/LSTM)
    → AI generate recommendations
    → Operator nhận notification
    → Operator review → Approve/Reject
    → Push alert cho Citizens gần đó
    → Nếu Critical → Notify Emergency Services
    → Emergency dispatch + request priority route
    → Hệ thống tính toán tuyến tối ưu + clear đèn tín hiệu
```

---

## License

MIT License — Duy Tan University, Vietnam

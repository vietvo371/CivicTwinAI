# CivicTwinAI

> 🏙️ Digital Twin — Nền tảng quản lý giao thông đô thị thông minh

## Tổng quan

CivicTwinAI là nền tảng Digital Twin cho quản lý giao thông đô thị thông minh:
- **Giám sát realtime** mạng giao thông qua IoT/sensor
- **Dự đoán** tắc nghẽn lan rộng trước khi xảy ra (LSTM/GNN)
- **Đề xuất hành động** cụ thể cho operator (reroute, priority route, alert)
- **Mô phỏng** tác động quy hoạch dài hạn

## Tech Stack

| Service | Công nghệ | Port |
|---------|-----------|------|
| **Backend** | Laravel 11+ (PHP 8.3) | 8000 |
| **Frontend** | Next.js 15 + Mapbox GL JS | 3000 |
| **AI Service** | Python FastAPI (LSTM/GNN) | 8001 |
| **Mobile** | React Native CLI | — |
| **Database** | PostgreSQL 16 + PostGIS | 5432 |
| **Cache** | Redis 7 | 6379 |
| **Message Broker** | Kafka | 9092 |
| **WebSocket** | Soketi | 6001 |
| **MQTT** | Mosquitto | 1883 |

## Cấu trúc dự án

```
CivicTwinAI/
├── backend/          # Laravel API + Queue + Events
├── frontend/         # Next.js 15 Dashboard + Mapbox
├── mobile/           # React Native CLI (Citizen + Emergency)
├── ai-service/       # Python FastAPI (Prediction + Simulation)
├── docs/             # Tài liệu dự án
├── docker/           # Docker configs
├── .agent/           # AI Agent configuration
├── docker-compose.yml
└── .env.example
```

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
cd frontend && npm install && npm run dev

# 5. Start AI service
cd ai-service && pip install -r requirements.txt && uvicorn app.main:app --port 8001
```

### Full Stack (Docker)

```bash
docker compose up -d
```

## Actors

| Actor | Phase | Mô tả |
|-------|-------|-------|
| City Admin | 1 | Quản trị toàn bộ hệ thống |
| Traffic Operator | 1 | Giám sát realtime, xử lý sự cố |
| Citizen | 2 | Báo cáo sự cố, nhận cảnh báo (mobile) |
| Emergency Services | 2 | Tuyến ưu tiên cứu hộ (mobile) |

## License



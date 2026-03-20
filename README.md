# CivicTwin AI: From Urban Chaos to Intelligent Flow

> 🏆 **Official Entry - TechGuard ASEAN Competition 2026**  
> **Team:** DTU 1 - TechGuard ASEAN (Duy Tan University, Vietnam)  
> **Track:** Smart City & Urban Sustainability  

<br>

<div align="center">
  <h3><em>"Chuyển đổi quản lý giao thông đô thị từ phản ứng sang Bức tranh Toàn cảnh Dự đoán & Chủ động."</em></h3>
</div>

---

## 🌎 The Challenge (Vấn đề)

In rapidly growing coastal cities like Da Nang, the convergence of tourism-driven urbanization and climate vulnerability creates critical management challenges. During peak tourist seasons, traffic congestion around the Dragon Bridge, My Khe Beach, and Hoi An approach routes intensifies dramatically. When localized incidents occur—a tour bus accident on Nguyen Van Linh or flash flooding on Le Duan—the disruption cascades through the city's limited road network, delaying emergency vehicles and stranding residents.

The 2022 Da Nang floods demonstrated how quickly a weather event can paralyze entire districts. Currently, the city's traffic management center monitors cameras reactively. The urgency is threefold: Da Nang's population doubles during tourism peaks; climate change increases flash flood frequency; and the critical "golden hour" for emergency services demands predictive, not reactive, management.

## 🧠 The AI Concept (Giải pháp)

**CivicTwin AI** creates a digital twin of Da Nang's transportation network—modeling key intersections (nodes) and roads (edges) as a dynamic graph system. The platform integrates real-time data from traffic cameras, flood sensors, weather stations, and citizen reports.

The AI engine employs three specialized approaches: 
- **LSTM Networks**: Predict traffic flow patterns during peak tourist hours.
- **Graph Neural Networks (GNN)**: Analyze how flooding on one riverside road propagates through interconnected streets.
- **Reinforcement Learning**: Optimize traffic light timing dynamically during emergencies.

When an incident occurs near the airport or beach areas, the system **simulates its cascading impact within seconds**, predicts gridlocks on evacuation routes, and automatically suggests optimal diversions. This transforms urban management from reactive monitoring to proactive decision-making.

---

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



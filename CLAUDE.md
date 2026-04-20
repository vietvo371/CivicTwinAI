# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MCP & Context Optimization

- **Priority Tooling**: Always prioritize using the `serena` MCP server for context gathering, project indexing, and code search.
- **Token Efficiency**: Before reading multiple files manually with `ls` or `cat`, use `serena`'s search/indexing tools to identify and fetch only the relevant code snippets.
- **Workflow**:
  1. Use `serena` to get a high-level overview of the project structure if not already in context.
  2. Use `serena` to locate specific logic or variable definitions across the codebase instead of broad file reads.
  3. Only request full file content if `serena`'s summaries are insufficient for the task.
- **Context Maintenance**: Use `serena` to update or refresh context when moving between different modules of the project.

## Project Overview

**CivicTwinAI** is a full-stack Digital Twin platform for predictive urban traffic management. It combines real-time IoT data ingestion, ML-based traffic prediction, and a multi-role web/mobile dashboard.

## Architecture

Four services communicate over a shared Docker network (`civictwin`):

```
IoT Sensors → MQTT (Mosquitto) → Kafka → Laravel Consumer → PostgreSQL
                                                        ↓
                                          WebSocket (Soketi) → Next.js Dashboard
                                                        ↓
                                       AI Trigger → Python FastAPI (LSTM/GNN)
                                                        ↓
                                       Predictions → Recommendations → Operator
```

| Service | Tech | Port |
|---------|------|------|
| `backend/` | Laravel 12 / PHP 8.3 | 8000 |
| `frontend/` | Next.js 16 / React 19 / TypeScript | 3000 |
| `mobile/` | React Native 0.81 | — |
| `ai-service/` | Python FastAPI + PyTorch | 8001 |
| PostgreSQL + PostGIS | — | 5432 |
| Redis | cache + queue | 6379 |
| Soketi | Pusher-compatible WebSocket | 6001 |
| Kafka + Zookeeper | IoT ingestion | 9092 |
| Mosquitto | MQTT broker | 1883 |

## Development Commands

### Quickstart (Docker)
```bash
docker compose up -d
docker exec -it civictwin-laravel php artisan migrate --seed
# Demo login: admin@civictwin.local / password
```

### Manual Development (recommended for active coding)
```bash
# Infrastructure only
docker compose up -d postgres redis soketi

# Backend (terminal 1)
cd backend && composer install
php artisan migrate --seed
php artisan serve            # :8000

# Queue worker (terminal 2)
cd backend && php artisan queue:work

# WebSocket server (terminal 3)
cd backend && php artisan reverb:start

# Frontend (terminal 4)
cd frontend && yarn install && yarn dev   # :3000

# AI service (terminal 5, optional)
cd ai-service && pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
```

### Convenience script
```bash
./dev.sh              # All services in new Terminal tabs
./dev.sh backend      # Backend only
./dev.sh frontend     # Frontend only
./dev.sh ai           # AI service only
./dev.sh reverb       # WebSocket server
./dev.sh worker       # Queue worker
./dev.sh sim          # Traffic simulator
```

### Testing
```bash
# Backend (PHPUnit, uses SQLite :memory:)
cd backend && php artisan test
cd backend && php artisan test --filter=AuthApiTest   # single test

# Linting
cd backend && ./vendor/bin/pint       # PHP code style
cd frontend && yarn lint
cd mobile && yarn lint

# AI service
cd ai-service && python -m pytest
```

### Database
```bash
cd backend
php artisan migrate                          # run pending
php artisan migrate:refresh --seed          # reset + reseed
php artisan db:seed --class=UserSeeder      # specific seeder
```

## Backend (Laravel) Architecture

**`app/Http/Controllers/Api/`** — All REST controllers, namespaced by role (Admin, Operator, Citizen, Emergency).

**`app/Models/`** — Key models: `User`, `Incident`, `Node`, `Edge`, `Sensor`, `Prediction`, `Recommendation`, `Report`.

**`app/Events/`** — Domain events (`IncidentCreated`, `PredictionReceived`, `RecommendationGenerated`) trigger broadcasting and async jobs.

**`app/Services/`** — Business logic layer. `PredictionService` calls the Python AI service via HTTP.

**`routes/api.php`** — 53+ endpoints grouped: `/auth/*`, `/citizen/*`, `/operator/*`, `/admin/*`, `/public/*`.

**`routes/channels.php`** — WebSocket channels: `private-incidents`, `presence-operators`, `traffic.edges`.

Role-based access uses **Spatie Laravel Permission**. Roles: `super_admin`, `city_admin`, `traffic_operator`, `urban_planner`, `citizen`, `emergency`.

## Frontend (Next.js) Architecture

Uses **App Router** with route groups for role isolation:
- `(admin)/` — Admin panel
- `(operator)/` — Operator dashboard (realtime map + charts)
- `(emergency)/` — Emergency console
- `(citizen)/` — Citizen portal (`/map`, `/alerts`)

**`src/lib/api.ts`** — Central Axios client with auth headers.

**`src/components/map/`** — Mapbox GL components. Map state is managed locally, not in a global store.

Real-time updates use **Pusher.js** connecting to Soketi on port 6001.

## AI Service Architecture

**`app/models/lstm_predictor.py`** — PyTorch LSTM model. Predicts traffic density/speed 30 min ahead.

**`app/models/gnn_predictor.py`** — NetworkX BFS graph model. Detects cascading congestion.

**`app/services/graph_service.py`** — Loads road graph from PostgreSQL (nodes + edges with PostGIS geometry).

**`ml/saved_models/`** — Trained model weights. Do not commit new weights without updating the training scripts in `ml/training/`.

## Mobile Architecture

**`src/navigation/`** — React Navigation with bottom tab navigator + native stack.

**`src/services/`** — API client, WebSocket (Pusher), Firebase FCM.

**`src/i18n/`** — Vietnamese + English translations.

State management uses **Zustand** (global) + React Context (auth, theme).

## Key Environment Variables

Copy `.env.example` in each service. Critical vars:
- `MAPBOX_TOKEN` — required for frontend map
- `FIREBASE_*` — for mobile push notifications
- `AI_SERVICE_URL` — backend calls AI on `http://localhost:8001`
- `PUSHER_*` / `REVERB_*` — WebSocket connection (both sets needed)
- `KAFKA_BROKERS`, `MQTT_HOST` — IoT ingestion

## Database

PostgreSQL 16 + PostGIS. Key tables:
- `nodes`, `edges`, `sensors`, `edges_sensors` — road network topology
- `incidents`, `reports` — incident management
- `predictions`, `recommendations` — AI outputs
- `zones` — geographic zones

Geometry columns use PostGIS types. Raw SQL with `ST_*` functions appears in `app/Services/` and `ai-service/app/services/graph_service.py`.

## Realtime Events

Events broadcast via Soketi (Pusher protocol). Channel naming:
- `private-incidents` — incident CRUD
- `presence-operators.{zone}` — operator presence
- `traffic.edges` — live edge metrics

Frontend subscribes in components using `window.Echo` (initialized in a provider). Mobile uses `react-native-pusher`.

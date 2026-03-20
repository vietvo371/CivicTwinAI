# PLAN — Phase 1: Core Backend + Dashboard

> 🤖 **Applying knowledge of `@project-planner`**

## Overview

Triển khai Phase 1 CivicTwin AI — xây dựng nền tảng Backend API + Dashboard cho **City Admin** và **Traffic Operator**. Đây là phase đầu tiên trong lộ trình reactive → proactive.

## Actors (Phase 1)

| Actor | Vai trò | Tương tác |
|-------|---------|-----------|
| **City Admin** | Quản trị hệ thống, cấu hình | Dashboard admin |
| **Traffic Operator** | Giám sát map, xử lý sự cố | Dashboard map + incident panel |

## Tech Stack (Phase 1)

| Layer | Công nghệ |
|-------|-----------|
| Backend | Laravel 11+ (PHP 8.3) |
| Frontend | Next.js 15 + Mapbox GL JS |
| AI Service | Python FastAPI (stub) |
| Database | PostgreSQL 16 + PostGIS |
| Cache/Queue | Redis |
| WebSocket | Soketi |
| Container | Docker Compose |

---

## Task Breakdown

### ⚙️ P0 — Hạ tầng (Không có dependencies)

#### Task 0.1: Init Laravel Backend
- **Agent:** `backend-specialist`
- **Skills:** `api-patterns`
- **Priority:** P0
- **Dependencies:** —
- **INPUT:** composer, PHP 8.3
- **OUTPUT:** `backend/` — Laravel 11 project structure, `.env` config
- **VERIFY:** `php artisan serve` chạy thành công, trả về welcome page

#### Task 0.2: Init Next.js Frontend
- **Agent:** `frontend-specialist`
- **Skills:** `react-best-practices`, `frontend-design`
- **Priority:** P0
- **Dependencies:** —
- **INPUT:** Node.js, npx
- **OUTPUT:** `frontend/` — Next.js 15 App Router project
- **VERIFY:** `npm run dev` → http://localhost:3000

#### Task 0.3: Init Python AI Service
- **Agent:** `ai-ml-engineer`
- **Skills:** `python-patterns`
- **Priority:** P0
- **Dependencies:** —
- **INPUT:** Python 3.11+
- **OUTPUT:** `ai-service/` — FastAPI skeleton + `/health` endpoint
- **VERIFY:** `uvicorn app.main:app` → http://localhost:8001/health

#### Task 0.4: Docker Compose hoàn chỉnh
- **Agent:** `devops-engineer`
- **Skills:** `deployment-procedures`
- **Priority:** P0
- **Dependencies:** Task 0.1, 0.2, 0.3
- **INPUT:** docker-compose.yml hiện tại
- **OUTPUT:** Dockerfile cho mỗi service, Compose chạy full stack
- **VERIFY:** `docker compose up -d` → tất cả services healthy

---

### 🗄️ P1 — Database Schema (Phải có trước API)

#### Task 1.1: Cài packages + Viết migrations
- **Agent:** `database-architect`
- **Skills:** `database-design`
- **Priority:** P1
- **Dependencies:** Task 0.1
- **INPUT:** `docs/database.md` (14 tables, FK dependencies)
- **OUTPUT:** 15 migration files theo thứ tự + PostGIS extension enable
- **VERIFY:** `php artisan migrate` thành công, kiểm tra `\dt` trong psql

#### Task 1.2: Seed Roles, Permissions, Sample Data
- **Agent:** `database-architect` + `traffic-engineer`
- **Skills:** `database-design`
- **Priority:** P1
- **Dependencies:** Task 1.1
- **INPUT:** `docs/database.md` Section 3 (Roles/Permissions) + `docs/business-logic.md`
- **OUTPUT:**
  - `RolePermissionSeeder` — 6 roles + 31 permissions
  - `GraphSeeder` — Mẫu 10 nodes + 15 edges + 3 zones (Sài Gòn)
  - `UserSeeder` — Admin + Operator + Demo users
- **VERIFY:** `php artisan db:seed`, kiểm tra `roles`, `permissions`, `nodes`, `edges` có data

---

### 🔌 P2 — Laravel API Core

#### Task 2.1: Auth API (Sanctum)
- **Agent:** `backend-specialist`
- **Skills:** `api-patterns`
- **Priority:** P2
- **Dependencies:** Task 1.1
- **INPUT:** users table + Sanctum
- **OUTPUT:**
  - `POST /api/auth/login` → token
  - `POST /api/auth/register`
  - `GET /api/auth/me` → user + roles + permissions
  - `POST /api/auth/logout`
- **VERIFY:** Login → nhận token → gọi `/me` → trả user info

#### Task 2.2: Graph API (Nodes + Edges)
- **Agent:** `backend-specialist` + `traffic-engineer`
- **Skills:** `api-patterns`
- **Priority:** P2
- **Dependencies:** Task 1.2
- **INPUT:** nodes, edges tables + PostGIS
- **OUTPUT:**
  - `GET /api/edges/geojson` → GeoJSON cho Mapbox
  - `GET /api/nodes` → Node list + filter by zone
  - `GET /api/edges?congestion=heavy` → Filter tắc
  - `GET /api/edges/nearby?lat=...&lng=...&radius=2000`
- **VERIFY:** GeoJSON response render được trên Mapbox

#### Task 2.3: Incident CRUD + Auto-detect Logic
- **Agent:** `backend-specialist` + `traffic-engineer`
- **Skills:** `api-patterns`
- **Priority:** P2
- **Dependencies:** Task 2.2
- **INPUT:** `docs/business-logic.md` Luồng 2 (Incident)
- **OUTPUT:**
  - `POST /api/incidents` — Tạo sự cố (operator/citizen)
  - `GET /api/incidents` — List + filter status/severity
  - `PATCH /api/incidents/{id}` — Update status
  - Auto-detect service: density spike → tạo incident tự động
  - Event: `IncidentCreated` → dispatch `CallAIPrediction` job
- **VERIFY:** Tạo incident → event fired → job dispatched

#### Task 2.4: Prediction + Recommendation API
- **Agent:** `backend-specialist` + `ai-ml-engineer`
- **Skills:** `api-patterns`
- **Priority:** P2
- **Dependencies:** Task 2.3, Task 3.1 (AI stub)
- **INPUT:** `docs/business-logic.md` Luồng 3 + 4
- **OUTPUT:**
  - `CallAIPrediction` job → gọi Python `/predict`
  - Save predictions + prediction_edges vào DB
  - Auto-generate recommendations
  - `GET /api/predictions?incident_id=...`
  - `GET /api/recommendations`
  - `PATCH /api/recommendations/{id}/approve`
- **VERIFY:** Incident → prediction → recommendation → approve flow hoàn chỉnh

#### Task 2.5: WebSocket Broadcasting (Soketi)
- **Agent:** `backend-specialist`
- **Skills:** `api-patterns`
- **Priority:** P2
- **Dependencies:** Task 2.2
- **INPUT:** Soketi config
- **OUTPUT:**
  - Broadcasting `EdgeMetricsUpdated` → map realtime
  - Broadcasting `IncidentCreated` → dashboard alert
  - Broadcasting `PredictionReceived` → overlay predictions
- **VERIFY:** Frontend nhận WebSocket events khi data thay đổi

---

### 🤖 P3 — Python AI Service

#### Task 3.1: FastAPI endpoints (mock)
- **Agent:** `ai-ml-engineer`
- **Skills:** `python-patterns`
- **Priority:** P2 (song song với P2)
- **Dependencies:** Task 0.3
- **INPUT:** `docs/business-logic.md` Luồng 3 + 5
- **OUTPUT:**
  - `POST /predict` — Nhận incident data → trả mock predictions
  - `POST /simulate` — Nhận scenario → trả mock comparison
  - Response format đúng contract với Laravel
- **VERIFY:** Laravel gọi được `/predict`, parse response thành công

---

### 🖥️ P3 — Next.js Dashboard

#### Task 3.2: Layout + Auth UI
- **Agent:** `frontend-specialist`
- **Skills:** `react-best-practices`, `frontend-design`
- **Priority:** P3
- **Dependencies:** Task 2.1
- **INPUT:** Dashboard design cho Traffic Operator
- **OUTPUT:**
  - Layout: Sidebar (navigation) + Main (content) + Header (user info)
  - Login page → Sanctum token → redirect dashboard
  - Protected routes (middleware auth)
- **VERIFY:** Login → redirect → sidebar navigation hoạt động

#### Task 3.3: Mapbox Traffic Map
- **Agent:** `frontend-specialist`
- **Skills:** `react-best-practices`, `frontend-design`
- **Priority:** P3
- **Dependencies:** Task 2.2, Task 3.2
- **INPUT:** GeoJSON API + Mapbox GL JS
- **OUTPUT:**
  - Map hiển thị edges (congestion colors: xanh/vàng/cam/đỏ)
  - Nodes markers (ngã tư, bùng binh)
  - Click edge → popup info (density, speed, status)
  - Realtime update từ WebSocket
- **VERIFY:** Map render edges với đúng màu congestion, click popup hoạt động

#### Task 3.4: Incident Panel
- **Agent:** `frontend-specialist`
- **Skills:** `react-best-practices`
- **Priority:** P3
- **Dependencies:** Task 2.3, Task 3.2
- **INPUT:** Incident API
- **OUTPUT:**
  - List incidents (filter status/severity)
  - Create incident form (chọn vị trí trên map)
  - Incident detail → predictions → recommendations
  - Approve/reject recommendation
- **VERIFY:** Tạo incident → xem predictions → approve recommendation

---

### 🔗 P4 — Integration (Full Flow)

#### Task 4.1: End-to-End Incident Flow
- **Agent:** `orchestrator`
- **Skills:** `parallel-agents`
- **Priority:** P4
- **Dependencies:** TẤT CẢ tasks trên
- **INPUT:** Full system
- **OUTPUT:** Proactive pipeline hoàn chỉnh:
  1. Sensor data → edge metrics update
  2. Density spike → auto-detect incident
  3. Incident → AI predict → recommendations
  4. Operator approve → broadcast alert
- **VERIFY:** Demo full flow từ sensor → map update → incident → predict → recommend → approve

---

### ✅ P5 — Verification

#### Task 5.1: Testing + Security
- **Agent:** `test-engineer` + `security-auditor`
- **Skills:** `testing-patterns`, `vulnerability-scanner`
- **Priority:** P5
- **Dependencies:** Task 4.1
- **INPUT:** Working code
- **OUTPUT:**
  - Unit tests cho core models (Edge, Incident, Prediction)
  - Feature tests cho API endpoints
  - Security scan (auth, RBAC, SQL injection)
- **VERIFY:** Tests pass, no critical vulnerabilities

---

## Dependencies Graph

```
P0: Init Services (song song)
 ├── Task 0.1: Laravel ─────────┐
 ├── Task 0.2: Next.js          │
 ├── Task 0.3: Python           │
 └── Task 0.4: Docker ──────────┤
                                │
P1: Database ◄──────────────────┘
 ├── Task 1.1: Migrations ──────┐
 └── Task 1.2: Seeders ─────────┤
                                │
P2: API + AI (song song) ◄──────┘
 ├── Task 2.1: Auth ────────────┐
 ├── Task 2.2: Graph API ───────┤
 ├── Task 2.3: Incident API ────┤
 ├── Task 2.4: Prediction API ──┤
 ├── Task 2.5: WebSocket ───────┤
 └── Task 3.1: AI Mock ─────────┤
                                │
P3: Dashboard ◄─────────────────┘
 ├── Task 3.2: Layout + Auth ───┐
 ├── Task 3.3: Mapbox Map ──────┤
 └── Task 3.4: Incident Panel ──┤
                                │
P4: Integration ◄───────────────┘
 └── Task 4.1: E2E Flow ────────┐
                                │
P5: Verify ◄────────────────────┘
 └── Task 5.1: Tests + Security
```

---

## Thứ tự Triển khai Đề xuất

| Đợt | Tasks | Thời gian ước tính |
|------|-------|--------------------|
| **Đợt 1** | 0.1 + 0.2 + 0.3 (init song song) | 1 session |
| **Đợt 2** | 1.1 + 1.2 (database) | 1 session |
| **Đợt 3** | 2.1 + 2.2 + 3.1 (Auth + Graph + AI mock) | 2 sessions |
| **Đợt 4** | 2.3 + 2.4 + 2.5 (Incident + Prediction + WS) | 2 sessions |
| **Đợt 5** | 3.2 + 3.3 + 3.4 (Dashboard) | 2–3 sessions |
| **Đợt 6** | 4.1 + 5.1 (Integration + Testing) | 1–2 sessions |

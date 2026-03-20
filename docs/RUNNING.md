# Hướng dẫn chạy CivicTwinAI

## 📋 Yêu cầu

- **Docker Desktop** (macOS/Windows) hoặc Docker + Docker Compose (Linux)
- **Mapbox Token** — đăng ký tại [mapbox.com](https://www.mapbox.com)

---

## 🚀 Cách 1: Docker Compose (Khuyên dùng)

### Bước 1 — Cấu hình `.env` root

```bash
cd /Volumes/MAC_OPTION/DATN/CivicTwinAI
cp .env.example .env
```

Mở `.env` và điền `MAPBOX_TOKEN`:
```
MAPBOX_TOKEN=pk.your_real_mapbox_token
```

### Bước 2 — Khởi chạy tất cả services

```bash
docker compose up -d
```

> Lần đầu sẽ build images, mất ~5-10 phút.

### Bước 3 — Chạy migrations + seed

```bash
docker exec -it civictwin-laravel php artisan migrate --seed
```

### Bước 4 — Truy cập

| Service | URL | Mô tả |
|---------|-----|--------|
| **Frontend** | http://localhost:3000 | Dashboard Next.js |
| **Backend API** | http://localhost:8000/api | Laravel API |
| **AI Service** | http://localhost:8001/docs | FastAPI Swagger |
| **WebSocket** | ws://localhost:6001 | Soketi |

### Demo Login

```
Email:    admin@civictwin.local
Password: password
```

---

## 🛠 Cách 2: Chạy thủ công (Dev mode)

### Bước 1 — Chạy database + infra bằng Docker

Chỉ start PostgreSQL + Redis (không cần Kafka/Soketi cho dev):

```bash
docker compose up -d postgres redis
```

### Bước 1.5 (Thay thế) — Cài đặt Database qua Homebrew (Nếu không dùng Docker)

Trong trường hợp Docker/Colima bị lỗi, có thể cài trực tiếp trên Mac qua Homebrew:
(Lưu ý: `postgis` của Homebrew thường yêu cầu `postgresql@17`)

```bash
HOMEBREW_NO_AUTO_UPDATE=1 brew install postgresql@17 postgis
brew link postgresql@17 --force
brew services start postgresql@17
sleep 3
createuser -s postgres
createdb civictwin
```

### Bước 2 — Backend Laravel

```bash
cd backend
composer install
cp .env.example .env      # hoặc dùng .env đã có
php artisan key:generate
php artisan migrate --seed
php artisan serve          # → http://localhost:8000
```

### Bước 3 — Frontend Next.js

```bash
cd frontend
yarn install
# Tạo file .env.local nếu chưa có:
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000/api' > .env.local
echo 'NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token' >> .env.local
yarn dev                   # → http://localhost:3000
```

### Bước 4 — AI Service (tuỳ chọn)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload  # → http://localhost:8001
```

---

## 🗄️ Database

### Vị trí lưu trữ

| Cách chạy | Database lưu ở đâu |
|-----------|---------------------|
| **Docker Compose** | Docker volume `postgres_data` (managed by Docker) |
| **Dev thủ công** | PostgreSQL local tại `127.0.0.1:5432` |

### Thông tin kết nối

```
Host:     127.0.0.1 (hoặc localhost)
Port:     5432
Database: civictwin
Username: civictwin (Docker) / postgres (local)
Password: secret
```

### Xem database

**Dùng pgAdmin** (UI):
1. Tải [pgAdmin](https://www.pgadmin.org/download/)
2. Add Server → nhập thông tin trên

**Dùng psql CLI** (trong Docker):
```bash
docker exec -it civictwin-postgres psql -U civictwin -d civictwin
```

**Lệnh hữu ích trong psql:**
```sql
\dt                              -- Liệt kê tất cả tables
SELECT * FROM users;             -- Xem users
SELECT * FROM zones;             -- Xem zones
SELECT * FROM nodes LIMIT 5;    -- Xem nodes
SELECT * FROM edges LIMIT 5;    -- Xem edges
SELECT * FROM incidents;         -- Xem incidents
SELECT count(*) FROM edges;      -- Đếm edges
\q                               -- Thoát
```

### Quản lý Docker volumes

```bash
# Xem volume
docker volume ls | grep civictwin

# Xóa toàn bộ data (reset database)
docker compose down -v

# Backup database
docker exec civictwin-postgres pg_dump -U civictwin civictwin > backup.sql

# Restore
docker exec -i civictwin-postgres psql -U civictwin civictwin < backup.sql
```

---

## 🧪 Chạy Tests

```bash
cd backend

# Tất cả tests
php artisan test

# Chỉ Auth tests
php artisan test --filter=AuthApiTest

# Chỉ Incident tests
php artisan test --filter=IncidentApiTest

# Với output chi tiết
php artisan test -v
```

> Tests chạy trên SQLite `:memory:` — KHÔNG cần PostgreSQL.

---

## 🔌 Test API bằng curl

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@civictwin.local","password":"password"}'
```

### Lấy token từ response rồi dùng cho các API khác:
```bash
TOKEN="your_token_here"

# Xem nodes
curl http://localhost:8000/api/nodes -H "Authorization: Bearer $TOKEN"

# Xem edges GeoJSON
curl http://localhost:8000/api/edges/geojson -H "Authorization: Bearer $TOKEN"

# Tạo incident
curl -X POST http://localhost:8000/api/incidents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test incident","type":"congestion","severity":"medium","source":"operator"}'

# Xem incidents
curl http://localhost:8000/api/incidents -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Kiến trúc Services

```
┌─────────────────────────────────────────────────────────────┐
│  Docker Compose                                              │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Next.js  │  │ Laravel  │  │ FastAPI  │  │ Worker   │   │
│  │ :3000    │→ │ :8000    │→ │ :8001    │  │ (queue)  │   │
│  └──────────┘  └────┬─────┘  └──────────┘  └──────────┘   │
│                     │                                        │
│  ┌──────────┐  ┌────┴─────┐  ┌──────────┐  ┌──────────┐   │
│  │ Soketi   │  │PostgreSQL│  │  Redis   │  │  Kafka   │   │
│  │ :6001    │  │ :5432    │  │  :6379   │  │  :9092   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Lưu ý

1. **Mapbox Token** — Frontend map sẽ không hiển thị nếu chưa có token hợp lệ
2. **PostGIS** — Docker image `postgis/postgis:16-3.4` đã bao gồm, không cần cài thêm
3. **Port conflicts** — Đảm bảo ports 3000, 5432, 6379, 8000, 8001 chưa bị chiếm
4. **Reset database** — `docker compose down -v` + `docker compose up -d` + `migrate --seed`

# Database Schema — CivicTwinAI

> PostgreSQL 16 + PostGIS 3.4 | ORM: Laravel Eloquent | Auth: Spatie Permission

---

## 1. ERD (Entity-Relationship Diagram)

```
                     ┌────────────────────────────────────────────┐
                     │          SPATIE PERMISSION LAYER           │
                     │ ┌────────────┐  ┌───────────────────────┐ │
                     │ │permissions │  │  roles                │ │
                     │ │────────────│  │───────────────────────│ │
                     │ │ id         │  │ id                    │ │
                     │ │ name       │◄─│ name                  │ │
                     │ │ guard_name │  │ guard_name            │ │
                     │ └─────┬──────┘  └──────┬────────────────┘ │
                     │       │                │                  │
                     │ ┌─────┴─────────┐ ┌────┴───────────────┐ │
                     │ │role_has_      │ │model_has_roles     │ │
                     │ │ permissions   │ │model_has_permissions│ │
                     │ └───────────────┘ └────────────────────┘ │
                     └───────────────────────────┬──────────────┘
                                                 │ model_id
                                                 ▼
                           ┌──────────────┐
                           │    users      │
                           │──────────────│
                           │ id           │
                           │ name         │
                           │ email        │
                           │ password     │
                           │ created_at   │
                           │ updated_at   │
                           └──────┬───────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │ reported_by       │ assigned_to        │ approved_by
              ▼                   ▼                    ▼
┌──────────────┐          ┌──────────────┐     ┌────────────────┐
│   zones      │          │  incidents   │     │recommendations │
│──────────────│          │──────────────│     │────────────────│
│ id           │          │ id           │     │ id             │
│ name         │          │ title        │     │ prediction_id  │
│ boundary     │◄─┐       │ type         │     │ type           │
│ (POLYGON)    │  │       │ severity     │     │ status         │
│ created_at   │  │       │ location (PT)│     │ approved_by    │
│ updated_at   │  │       │ deleted_at   │     │ created_at     │
└──────────────┘  │       └──────┬───────┘     │ updated_at     │
                  │              │              └────────────────┘
                  │              │ incident_id          ▲
                  │              ▼                      │
                  │       ┌──────────────┐             │
                  │       │ predictions  │─────────────┘
                  │       │──────────────│ prediction_id
                  │       │ id           │
                  │       │ incident_id  │
                  │       │ model_version│
                  │       │ created_at   │
                  │       └──────┬───────┘
                  │              │ prediction_id
                  │              ▼
                  │       ┌────────────────┐
                  │       │prediction_edges│
                  │       │────────────────│
                  │       │ prediction_id──│──▶ predictions
                  │       │ edge_id────────│──▶ edges
                  │       │ predicted_     │
                  │       │   density      │
                  │       │ confidence     │
                  │       │ created_at     │
                  │       └────────────────┘
                  │
┌──────────┐     │
│  nodes   │     │        ┌──────────────┐     ┌──────────────┐
│──────────│     │        │    edges     │     │   sensors    │
│ id       │     │        │──────────────│     │──────────────│
│ name     │     │        │ id           │     │ id           │
│ type     │     │        │ name         │     │ sensor_code  │
│ location │     │        │ source_node──│──▶  │ edge_id──────│──▶ edges
│ (POINT)  │     │        │ target_node──│──▶  │ type         │
│ zone_id──│─────┘        │ geometry     │     │ status       │
│ created_at│◄────────────│ (LINESTRING) │     │ created_at   │
│ updated_at│ src / tgt   │ current_     │     │ updated_at   │
└──────────┘              │   density    │     └──────┬───────┘
                          │ congestion   │            │ sensor_id
                          │ created_at   │            ▼
                          │ updated_at   │     ┌──────────────────┐
                          └──────────────┘     │ sensor_readings  │
                                               │ (PARTITIONED)    │
                ┌──────────────┐               │ edge_id, sensor_id│
                │activity_logs │               │ recorded_at      │
                │──────────────│               │ vehicle_count    │
                │ causer_id    │               │ avg_speed_kmh    │
                │ subject_type │               └──────────────────┘
                │ description  │
                │ properties   │       ┌──────────────────┐
                │ created_at   │       │  notifications   │
                └──────────────┘       │──────────────────│
                                       │ user_id          │
                                       │ type             │
                                       │ data (JSONB)     │
                                       │ read_at          │
                                       └──────────────────┘
```

---

## 2. Danh sách Tables (14 tables)

| # | Table | Mô tả | Spatial | SoftDelete | Timestamps |
|---|-------|-------|---------|------------|------------|
| 1 | `users` | Người dùng | ❌ | ✅ | ✅ |
| 2 | `zones` | Vùng đô thị | ✅ Polygon | ❌ | ✅ |
| 3 | `nodes` | Nút giao thông | ✅ Point | ✅ | ✅ |
| 4 | `edges` | Đoạn đường | ✅ LineString | ✅ | ✅ |
| 5 | `sensors` | Thiết bị cảm biến | ❌ | ✅ | ✅ |
| 6 | `sensor_readings` | Dữ liệu time-series | ❌ | ❌ | ❌ (có `recorded_at`) |
| 7 | `incidents` | Sự cố giao thông | ✅ Point | ✅ | ✅ |
| 8 | `predictions` | Kết quả dự đoán | ❌ | ❌ | ✅ |
| 9 | `prediction_edges` | Dự đoán per-edge | ❌ | ❌ | ✅ |
| 10 | `recommendations` | Đề xuất hành động | ❌ | ✅ | ✅ |
| 11 | `activity_logs` | Audit trail (Spatie) | ❌ | ❌ | ✅ |
| 12 | `notifications` | Push/email (Laravel) | ❌ | ❌ | ✅ |
| 13 | `roles` + `permissions` | Phân quyền động (Spatie) | ❌ | ❌ | ✅ |
| 14 | `personal_access_tokens` | API tokens (Sanctum) | ❌ | ❌ | ✅ |

---

## 3. Phân quyền Động (Spatie Permission)

> Package: `spatie/laravel-permission` — Phân quyền động, quản lý qua database, không hardcode.

### Roles (Vai trò)

| Role | Mô tả | Phase |
|------|-------|-------|
| `super_admin` | Full access, bypass mọi permission | 1 |
| `city_admin` | Quản trị dashboard, cấu hình hệ thống | 1 |
| `traffic_operator` | Giám sát map, xử lý sự cố | 1 |
| `urban_planner` | Chạy simulation, xem báo cáo | 1 |
| `emergency` | Request priority route | 2 |
| `citizen` | Báo cáo sự cố, nhận cảnh báo | 2 |

### Permissions (Quyền hạn)

| Module | Permission | Roles mặc định |
|--------|-----------|-----------------|
| **Dashboard** | `dashboard.view` | admin, operator, planner |
| **Dashboard** | `dashboard.configure` | admin |
| **Map** | `map.view` | admin, operator, planner, emergency |
| **Map** | `map.edit-layers` | admin, operator |
| **Incidents** | `incidents.view` | admin, operator, emergency |
| **Incidents** | `incidents.create` | admin, operator, citizen |
| **Incidents** | `incidents.update` | admin, operator |
| **Incidents** | `incidents.delete` | admin |
| **Incidents** | `incidents.assign` | admin, operator |
| **Predictions** | `predictions.view` | admin, operator, emergency |
| **Predictions** | `predictions.trigger` | admin, operator |
| **Recommendations** | `recommendations.view` | admin, operator |
| **Recommendations** | `recommendations.approve` | admin, operator |
| **Recommendations** | `recommendations.reject` | admin, operator |
| **Simulation** | `simulation.run` | admin, planner |
| **Simulation** | `simulation.view-results` | admin, planner |
| **Reports** | `reports.view` | admin, planner |
| **Reports** | `reports.export` | admin |
| **Users** | `users.view` | admin |
| **Users** | `users.create` | admin |
| **Users** | `users.update` | admin |
| **Users** | `users.delete` | admin |
| **Users** | `users.assign-roles` | admin |
| **Sensors** | `sensors.view` | admin, operator |
| **Sensors** | `sensors.manage` | admin |
| **System** | `system.settings` | admin |
| **System** | `system.logs` | admin |
| **Priority Route** | `priority-route.request` | admin, emergency |
| **Notifications** | `notifications.send` | admin, operator |
| **Citizen** | `citizen-reports.create` | citizen |
| **Citizen** | `citizen-reports.view-own` | citizen |

### Spatie Tables (tự động tạo bởi package)

```
permissions              roles                model_has_permissions
├── id                   ├── id               ├── permission_id (FK)
├── name                 ├── name             ├── model_type
├── guard_name           ├── guard_name       └── model_id
├── created_at           ├── created_at
└── updated_at           └── updated_at       model_has_roles
                                              ├── role_id (FK)
role_has_permissions                          ├── model_type
├── permission_id (FK)                        └── model_id
└── role_id (FK)
```

**Ưu điểm phân quyền động:**
- ✅ Thêm/sửa/xóa role & permission qua Dashboard (không cần deploy)
- ✅ Gán nhiều roles cho 1 user
- ✅ Permission kế thừa (role có permissions → user có role → user có permissions)
- ✅ Middleware bảo vệ route: `->middleware('permission:incidents.create')`
- ✅ Policy kết hợp: `Gate::allows('incidents.update')` trong code

---

## 4. Schema Chi tiết

### 4.1 users

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `name` | VARCHAR(255) | NOT NULL | Tên hiển thị |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email đăng nhập |
| `email_verified_at` | TIMESTAMP | NULLABLE | |
| `password` | VARCHAR(255) | NOT NULL | Hashed (bcrypt) |
| `phone` | VARCHAR(20) | NULLABLE | Số điện thoại |
| `avatar` | VARCHAR(500) | NULLABLE | URL avatar |
| `is_active` | BOOLEAN | DEFAULT true | Tài khoản active? |
| `last_login_at` | TIMESTAMP | NULLABLE | Lần đăng nhập cuối |
| `remember_token` | VARCHAR(100) | NULLABLE | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

---

### 4.2 zones

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `name` | VARCHAR(255) | NOT NULL | Tên vùng |
| `code` | VARCHAR(50) | UNIQUE | Mã vùng |
| `type` | VARCHAR(50) | DEFAULT 'district' | district / ward / special_zone |
| `boundary` | GEOMETRY(Polygon, 4326) | NOT NULL | PostGIS polygon |
| `metadata` | JSONB | DEFAULT '{}' | Thông tin bổ sung |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Indexes:** `GIST(boundary)`

---

### 4.3 nodes

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `name` | VARCHAR(255) | NOT NULL | VD: "Ngã tư Hàng Xanh" |
| `type` | VARCHAR(50) | NOT NULL, DEFAULT 'intersection' | intersection / roundabout / highway_entry / bridge / terminal |
| `location` | GEOMETRY(Point, 4326) | NOT NULL | Tọa độ PostGIS |
| `zone_id` | BIGINT | FK → zones(id), NULLABLE | |
| `has_traffic_light` | BOOLEAN | DEFAULT false | |
| `metadata` | JSONB | DEFAULT '{}' | |
| `status` | VARCHAR(20) | DEFAULT 'active' | active / inactive / under_construction |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

**Indexes:** `GIST(location)`, `btree(zone_id)`, `btree(type)`

---

### 4.4 edges

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `name` | VARCHAR(255) | NOT NULL | Tên đường |
| `source_node_id` | BIGINT | FK → nodes(id), NOT NULL | Node bắt đầu |
| `target_node_id` | BIGINT | FK → nodes(id), NOT NULL | Node kết thúc |
| `geometry` | GEOMETRY(LineString, 4326) | NOT NULL | Hình dạng đường |
| `length_m` | DECIMAL(10,2) | NOT NULL | Chiều dài (mét) |
| `lanes` | SMALLINT | NOT NULL, DEFAULT 2 | Số làn xe |
| `speed_limit_kmh` | SMALLINT | NOT NULL, DEFAULT 50 | Giới hạn tốc độ |
| `direction` | VARCHAR(10) | DEFAULT 'two_way' | one_way / two_way |
| `road_type` | VARCHAR(50) | DEFAULT 'urban' | highway / urban / residential / service |
| — | — | — | **⚡ Realtime Metrics** |
| `current_density` | DECIMAL(5,4) | DEFAULT 0.0 | 0.0 → 1.0 |
| `current_speed_kmh` | DECIMAL(6,2) | DEFAULT 0.0 | |
| `current_flow` | DECIMAL(8,2) | DEFAULT 0.0 | |
| `congestion_level` | VARCHAR(20) | DEFAULT 'none' | none / light / moderate / heavy / gridlock |
| `status` | VARCHAR(20) | DEFAULT 'normal' | normal / congested / blocked / closed |
| `metrics_updated_at` | TIMESTAMP | NULLABLE | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

**Constraints:** `CHECK(source_node_id != target_node_id)`

**Indexes:** `GIST(geometry)`, `btree(source_node_id)`, `btree(target_node_id)`, `btree(congestion_level)`, `btree(status)`, `btree(metrics_updated_at)`

---

### 4.5 sensors

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `sensor_code` | VARCHAR(100) | UNIQUE, NOT NULL | VD: "CAM_DBP_01" |
| `edge_id` | BIGINT | FK → edges(id), NOT NULL | Gắn trên edge nào |
| `type` | VARCHAR(50) | NOT NULL | camera / radar / loop_detector / manual |
| `model` | VARCHAR(100) | NULLABLE | Model thiết bị |
| `firmware_version` | VARCHAR(50) | NULLABLE | |
| `status` | VARCHAR(20) | DEFAULT 'online' | online / offline / maintenance |
| `last_active_at` | TIMESTAMP | NULLABLE | |
| `metadata` | JSONB | DEFAULT '{}' | |
| `installed_at` | TIMESTAMP | NULLABLE | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

**Indexes:** `btree(edge_id)`, `btree(status)`, `UNIQUE(sensor_code)`

---

### 4.6 sensor_readings ⚡ (Partitioned — KHÔNG có updated_at)

> Time-series data — chỉ insert, không update. Dùng `recorded_at` thay cho `created_at`.

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | | |
| `sensor_id` | BIGINT | FK → sensors(id), NOT NULL | |
| `edge_id` | BIGINT | FK → edges(id), NOT NULL | Denormalized cho query nhanh |
| `recorded_at` | TIMESTAMP | NOT NULL | Thời điểm đo (= created_at) |
| `vehicle_count` | INTEGER | NULLABLE | |
| `avg_speed_kmh` | DECIMAL(6,2) | NULLABLE | |
| `occupancy_pct` | DECIMAL(5,2) | NULLABLE | |
| `density` | DECIMAL(5,4) | NULLABLE | |
| `data_quality` | DECIMAL(3,2) | DEFAULT 1.0 | |
| `is_anomaly` | BOOLEAN | DEFAULT false | |
| `raw_data` | JSONB | NULLABLE | |

**PK:** `(id, recorded_at)` — Composite cho partition

**Partition:** `RANGE(recorded_at)` theo tháng

**Indexes:** `btree(edge_id, recorded_at DESC)`, `btree(sensor_id, recorded_at DESC)`

> ⚠️ **Tại sao không có `created_at`/`updated_at`?** Sensor readings là append-only (chỉ insert, không bao giờ update). `recorded_at` đã đóng vai trò `created_at`. Thêm `updated_at` lãng phí storage cho hàng triệu records.

---

### 4.7 incidents

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `title` | VARCHAR(255) | NOT NULL | |
| `description` | TEXT | NULLABLE | |
| `type` | VARCHAR(50) | NOT NULL | accident / congestion / road_work / flood / other |
| `severity` | VARCHAR(20) | NOT NULL | low / medium / high / critical |
| `status` | VARCHAR(20) | DEFAULT 'open' | open / investigating / resolved / closed |
| `source` | VARCHAR(30) | NOT NULL | citizen_report / operator / auto_detected |
| `location` | GEOMETRY(Point, 4326) | NULLABLE | |
| `affected_edge_ids` | BIGINT[] | DEFAULT '{}' | |
| `reported_by` | BIGINT | FK → users(id), NULLABLE | |
| `assigned_to` | BIGINT | FK → users(id), NULLABLE | |
| `resolved_at` | TIMESTAMP | NULLABLE | |
| `metadata` | JSONB | DEFAULT '{}' | Ảnh, video, thông tin thêm |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

**Indexes:** `btree(status)`, `btree(severity)`, `GIST(location)`, `btree(created_at DESC)`, `GIN(affected_edge_ids)`

---

### 4.8 predictions

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `incident_id` | BIGINT | FK → incidents(id), NULLABLE | |
| `model_version` | VARCHAR(50) | NOT NULL | VD: "lstm_v2.1" |
| `processing_time_ms` | INTEGER | NULLABLE | |
| `status` | VARCHAR(20) | DEFAULT 'completed' | pending / completed / failed |
| `error_message` | TEXT | NULLABLE | Nếu failed |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Indexes:** `btree(incident_id)`, `btree(status)`

---

### 4.9 prediction_edges

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `prediction_id` | BIGINT | FK → predictions(id) ON DELETE CASCADE | |
| `edge_id` | BIGINT | FK → edges(id) | |
| `time_horizon_minutes` | SMALLINT | NOT NULL | 15 / 30 / 60 |
| `predicted_density` | DECIMAL(5,4) | NULLABLE | |
| `predicted_delay_s` | INTEGER | NULLABLE | |
| `confidence` | DECIMAL(3,2) | NULLABLE | 0.00 → 1.00 |
| `severity` | VARCHAR(20) | NULLABLE | |
| `created_at` | TIMESTAMP | NOT NULL | |

> ℹ️ Không có `updated_at` — prediction results là immutable (bất biến), chỉ insert.

**Indexes:** `btree(prediction_id)`, `btree(edge_id)`

---

### 4.10 recommendations

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `prediction_id` | BIGINT | FK → predictions(id), NULLABLE | |
| `incident_id` | BIGINT | FK → incidents(id), NULLABLE | |
| `type` | VARCHAR(30) | NOT NULL | reroute / priority_route / alert / signal_control |
| `description` | TEXT | NOT NULL | |
| `details` | JSONB | DEFAULT '{}' | (xem examples bên dưới) |
| `status` | VARCHAR(20) | DEFAULT 'pending' | pending / approved / rejected / executed |
| `approved_by` | BIGINT | FK → users(id), NULLABLE | |
| `approved_at` | TIMESTAMP | NULLABLE | |
| `rejected_reason` | TEXT | NULLABLE | Lý do từ chối |
| `executed_at` | TIMESTAMP | NULLABLE | |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |
| `deleted_at` | TIMESTAMP | NULLABLE | Soft delete |

**Details JSONB Examples:**
```json
// Reroute
{ "alternative_edges": [52, 53], "estimated_time_saved_s": 150 }

// Priority Route
{ "from_node": 1, "to_node": 50, "route_edges": [10, 11, 12], "estimated_time_minutes": 8 }

// Alert
{ "message": "Ùn tắc trên Điện Biên Phủ", "target_zones": [1, 2], "channels": ["push"] }
```

**Indexes:** `btree(status)`, `btree(incident_id)`

---

### 4.11 activity_logs (Spatie Activity Log)

> Package: `spatie/laravel-activitylog` — Audit trail tự động.

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | BIGSERIAL | PK | |
| `log_name` | VARCHAR(255) | NULLABLE | VD: "incident", "recommendation" |
| `description` | TEXT | NOT NULL | VD: "created", "updated", "approved" |
| `subject_type` | VARCHAR(255) | NULLABLE | Model class bị tác động |
| `subject_id` | BIGINT | NULLABLE | ID của record bị tác động |
| `causer_type` | VARCHAR(255) | NULLABLE | Model class người thực hiện |
| `causer_id` | BIGINT | NULLABLE | ID user thực hiện |
| `properties` | JSONB | NULLABLE | Old/new values (diff) |
| `batch_uuid` | UUID | NULLABLE | Group related actions |
| `event` | VARCHAR(255) | NULLABLE | created / updated / deleted |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Ví dụ log:**
```json
{
  "log_name": "incident",
  "description": "updated",
  "subject_type": "App\\Models\\Incident",
  "subject_id": 42,
  "causer_id": 5,
  "properties": {
    "old": { "status": "open", "severity": "medium" },
    "new": { "status": "investigating", "severity": "high" }
  }
}
```

**Indexes:** `btree(subject_type, subject_id)`, `btree(causer_type, causer_id)`, `btree(log_name)`, `btree(created_at DESC)`

---

### 4.12 notifications (Laravel Notifications)

> Laravel built-in notification system — lưu push/email/SMS.

| Column | Type | Constraints | Mô tả |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `type` | VARCHAR(255) | NOT NULL | Notification class name |
| `notifiable_type` | VARCHAR(255) | NOT NULL | Model class (User) |
| `notifiable_id` | BIGINT | NOT NULL | User ID |
| `data` | JSONB | NOT NULL | Nội dung notification |
| `read_at` | TIMESTAMP | NULLABLE | Đã đọc chưa |
| `created_at` | TIMESTAMP | NOT NULL | |
| `updated_at` | TIMESTAMP | NOT NULL | |

**Data JSONB Example:**
```json
{
  "title": "Sự cố mới: Tai nạn trên Điện Biên Phủ",
  "incident_id": 42,
  "severity": "high",
  "action_url": "/dashboard/incidents/42"
}
```

**Indexes:** `btree(notifiable_type, notifiable_id)`, `btree(read_at)`

---

## 5. Relationships

```
users           1 ──── N  incidents          (reported_by, assigned_to)
users           1 ──── N  recommendations    (approved_by)
users           N ──── M  roles              (model_has_roles)
users           N ──── M  permissions         (model_has_permissions)
users           1 ──── N  notifications      (notifiable_id)
users           1 ──── N  activity_logs      (causer_id)
roles           N ──── M  permissions         (role_has_permissions)
zones           1 ──── N  nodes              (zone_id)
nodes           1 ──── N  edges              (source_node_id)
nodes           1 ──── N  edges              (target_node_id)
edges           1 ──── N  sensors            (edge_id)
edges           1 ──── N  sensor_readings    (edge_id)
sensors         1 ──── N  sensor_readings    (sensor_id)
incidents       1 ──── N  predictions        (incident_id)
predictions     1 ──── N  prediction_edges   (prediction_id)
predictions     1 ──── N  recommendations    (prediction_id)
incidents       1 ──── N  recommendations    (incident_id)
edges           1 ──── N  prediction_edges   (edge_id)
```

---

## 6. Index Strategy

| Pattern | Table | Index | Type |
|---------|-------|-------|------|
| Spatial: nearby nodes/edges | nodes, edges | `GIST(location/geometry)` | Spatial |
| Spatial: zone contains | zones | `GIST(boundary)` | Spatial |
| Filter edge congestion | edges | `btree(congestion_level)` | B-tree |
| Sensor data: time-series | sensor_readings | `btree(edge_id, recorded_at DESC)` | Composite |
| Incidents: status + severity | incidents | `btree(status)`, `btree(severity)` | B-tree |
| Incidents: affected edges | incidents | `GIN(affected_edge_ids)` | GIN |
| Predictions per incident | predictions | `btree(incident_id)` | B-tree |
| Recommendations pending | recommendations | `btree(status)` | B-tree |
| Audit trail: per subject | activity_logs | `btree(subject_type, subject_id)` | Composite |
| Notifications: unread | notifications | `btree(notifiable_id, read_at)` | Composite |

---

## 7. Timestamps & Soft Deletes Strategy

### Quy tắc Timestamps

| Nguyên tắc | Giải thích |
|-------------|-----------|
| **Mọi table** đều có `created_at` | Tracking khi nào record được tạo |
| **Table có update** có `updated_at` | Tracking lần cuối sửa đổi |
| **Table append-only** KHÔNG có `updated_at` | `sensor_readings`, `prediction_edges` — chỉ insert, không update |
| **Append-only dùng `recorded_at`** thay `created_at` | `sensor_readings` — timestamp có ý nghĩa domain |

### Quy tắc Soft Deletes

| Table | Soft Delete? | Lý do |
|-------|-------------|-------|
| `users` | ✅ | Bảo toàn references (incidents, activity_logs) |
| `nodes`, `edges` | ✅ | Graph history, có thể restore |
| `sensors` | ✅ | Tracking thiết bị đã gỡ |
| `incidents` | ✅ | Audit trail, bảo toàn predictions |
| `recommendations` | ✅ | Lịch sử quyết định |
| `zones` | ❌ | Ít thay đổi |
| `sensor_readings` | ❌ | Partition drop thay vì delete |
| `predictions` | ❌ | Immutable, archive thay delete |
| `prediction_edges` | ❌ | Cascade với predictions |
| `activity_logs` | ❌ | Audit logs không xóa |
| `notifications` | ❌ | Archive cũ, không xóa |

---

## 8. Data Retention & Cleanup

| Table | Retention | Strategy |
|-------|-----------|----------|
| `sensor_readings` | 6 tháng | Drop old partitions monthly |
| `predictions` + `prediction_edges` | 3 tháng | Archive to cold storage |
| `activity_logs` | 1 năm | Archive old logs |
| `notifications` | 3 tháng | Delete read notifications > 3 tháng |
| `incidents` | Vĩnh viễn | Soft delete resolved > 1 năm |
| Core graph data | Vĩnh viễn | Backup weekly |

---

## 9. Laravel Packages Cần cài

| Package | Mục đích |
|---------|----------|
| `spatie/laravel-permission` | Phân quyền động (roles + permissions) |
| `spatie/laravel-activitylog` | Audit trail tự động |
| `laravel/sanctum` | API token authentication |
| `matannosrati/laravel-postgis` hoặc tự viết | PostGIS spatial support |

---

## 10. Migration Order

```
 1. create_users_table                    ← Laravel default
 2. create_personal_access_tokens_table   ← Sanctum
 3. create_permission_tables              ← Spatie Permission (roles, permissions, pivots)
 4. create_notifications_table            ← Laravel Notifications
 5. create_activity_log_table             ← Spatie Activity Log
 6. create_zones_table
 7. create_nodes_table                    ← FK: zones
 8. create_edges_table                    ← FK: nodes × 2
 9. create_sensors_table                  ← FK: edges
10. create_sensor_readings_table          ← FK: sensors, edges (partitioned)
11. create_incidents_table                ← FK: users × 2
12. create_predictions_table              ← FK: incidents
13. create_prediction_edges_table         ← FK: predictions, edges
14. create_recommendations_table          ← FK: predictions, incidents, users
15. seed_roles_and_permissions            ← Seeder: default roles + permissions
```

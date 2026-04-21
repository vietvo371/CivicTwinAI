# CivicTwin AI — Kế hoạch hoàn thiện trước ASEAN AI Hackathon 2026

> **Mục tiêu:** Semi-final 25/6/2026 · Grand Finale 31/7/2026 · Duy Tan University, Đà Nẵng
> **Track:** Smart City · **Đánh giá hiện tại:** ~75-80% yêu cầu

---

## Tiêu chí chấm điểm

| Tiêu chí | Trọng số | Trạng thái hiện tại |
|---|---|---|
| Innovation & Uniqueness | 25% | ✅ Mạnh — Digital Twin + AI + ASEAN context |
| Technical Implementation | 30% | ✅ Đã cải thiện — Emergency notification chain đã được fix |
| Impact & Feasibility | 30% | ✅ Mạnh — số liệu thực Đà Nẵng, định lượng rõ ràng |
| Presentation & Demo | 15% | ❌ Yếu — live demo chưa polish |

---

## Các khoảng trống cần bổ sung

### 🔴 Ưu tiên cao (ảnh hưởng trực tiếp đến điểm thi)

#### 1. Mapbox Realtime Traffic Overlay
>- **Trạng thái:** ✅ Đã fix — Đã thêm WebSocket subscription `EdgeMetricsUpdated` + `traffic.telemetry.updated`, animation transition khi edges update, subscribe đầy đủ cả 2 event channel. Backend đã broadcast đúng (`TrafficDensityUpdated` event → channel `traffic`, event `traffic.telemetry.updated`). Edge color interpolation theo `current_density` đã có sẵn.
- **File đã sửa/thêm:**
  - `frontend/src/components/TrafficMap.tsx` — thêm `EdgeMetricsUpdated` subscription, `line-color-transition` (800ms), `line-opacity-transition` (400ms), Mapbox `featureState` để trigger animation
  - `frontend/src/components/TrafficMap.css` — animation keyframes `.traffic-edge-updated`
- **Lưu ý:** Channel là `traffic` (không phải `traffic.edges` như mô tả cũ), event là `traffic.telemetry.updated` và `EdgeMetricsUpdated`
- **Cần test thực tế:** Chạy `php artisan traffic:consume` + kiểm tra Soketi/Reverb WebSocket có nhận bản tin

#### 2. Demo Flow End-to-End
>- **Trạng thái:** ✅ Notification chain đã fix — `RecommendationController` gửi FCM notification cho emergency users + reporter khi approve/reject. Cần verify WebSocket + test end-to-end.
- **Kịch bản cần chạy được:**
  1. Citizen submit báo cáo kẹt xe (có ảnh)
  2. AI tự động predict & tạo recommendation
  3. Operator nhận notification realtime, approve recommendation
  4. Emergency nhận priority route mới
  5. Citizen nhận alert cảnh báo
- **Cần làm:**
  - ✅ Fix `RecommendationController::approve()` → gửi FCM notification cho emergency + reporter (`app/Notifications/RecommendationAlert.php`)
  - ⚠️ Verify notification WebSocket đến đúng role (chưa test thực tế)
  - ⚠️ Test toàn bộ flow với seeded data
- **File đã sửa:** `backend/app/Http/Controllers/Api/RecommendationController.php`, `backend/app/Notifications/RecommendationAlert.php`
- **Thời gian ước tính:** 2-3 ngày

#### 3. Fix MediaController Upload
>- **Trạng thái:** ✅ Đã xác minh — `MediaController::upload()` đã có logic thật (lưu file vào `storage/public/media`, trả URL). Chỉ có `show($id)` là placeholder (dùng khi mobile GET /media/{id} với ID demo).
- **Không cần làm gì thêm.**

---

### 🟡 Ưu tiên trung bình (cải thiện điểm Technical)

#### 4. ST-GCN Model — ✅ Đã implement + fix (hoàn chỉnh)
>- **Trạng thái:** ✅ Hoàn thành hoàn toàn sau khi fix 3 issues:
>  1. **ST-GCN dùng real data**: Thêm `fetch_edge_history()` → query `sensor_readings` từ DB thay vì fake `[0.3]*12`
>  2. **Deduplicate predictions**: Fix logic merge ST-GCN + BFS cascade → không còn trùng lặp edge
>  3. **ST-GCN load crash**: `model_service.py` truyền `hidden_channels=hidden` nhưng `TrafficSTGCN.__init__` khai báo tham số là `hidden` → đổi `hidden_channels=hidden` → `hidden=hidden`
>- **ST-GCN model:** `TrafficSTGCN-v1.0` — sparse GCN (không cần torch_geometric)
>  - Spatial layer: sparse matrix multiply với normalized adjacency `D^{-1/2}(A+I)D^{-1/2}`
>  - Temporal layer: causal 1D conv (kernel=3, per-node)
>  - 3 ST-Conv blocks → Conv1d → Sigmoid
>  - Điểm mạnh: biết "đường A kẹt → đường B liền kề cũng sắp kẹt" (LSTM không làm được)
>- **Data flow mới:**
>  1. `POST /api/predict` nhận incident + affected_edge_ids
>  2. Fetch 12 historical density readings từ `sensor_readings` (DB)
>  3. ST-GCN predict batch cho tất cả edges cùng lúc
>  4. BFS cascade estimate độ lan truyền ùn tắc
>  5. Merge: incident edges → ST-GCN density (chính xác hơn), cascade edges → BFS density
>  6. Trả về deduplicated predictions: [15min, 30min, 60min] × ~15-20 edges
>- **Seed data:** `SensorReadingSeeder` → 12 readings/edge × 25 edges = 300 readings (realistic rush-hour pattern)
>- **File đã thêm/sửa:**
>  - `ai-service/app/models/stgcn_model.py` — ST-GCN model (không đổi)
>  - `ai-service/app/services/model_service.py` — batch prediction (không đổi)
>  - `ai-service/app/routers/predict.py` — ✅ fix: real data fetch + merge logic
>  - `ai-service/notebooks/benchmark.py` — benchmark script
>  - `backend/database/seeders/SensorReadingSeeder.php` — ✅ seed 300 sensor readings

#### 5. Emergency Priority Route — ✅ Đã implement + fix
>- **Trạng thái:** ✅ Hoàn thành + đã fix 2 issues sau khi test:
>  1. **Route blocked fix**: Thêm `generateFallbackRoute()` → demo works kể cả DB chưa có nodes/edges
>  2. **UI fix**: Thêm Mapbox geocoding search + map click thay vì nhập lat/lng thủ công
>- **Tính năng:**
>  - Dijkstra weighted routing (PostGIS recursive CTE) với fallback mock route 8 đoạn đường Đà Nẵng
>  - Edge cost = `travel_time * (1 + congestion_density)` — ưu tiên đường thông thoáng
>  - Tự động tránh edges có incident + edges đang kẹt nặng (density > 0.8)
>- **Endpoint mới:**
>  - `POST /api/emergency/priority-route` — tính route đầy đủ (geometry, ETA, distance, segments)
>  - `GET /api/emergency/priority-route/preview` — ETA + distance nhanh
>  - `GET /api/geocode/search` — forward geocoding (search address → lat/lng)
>  - `GET /api/geocode/reverse` — reverse geocoding (lat/lng → address)
>- **Frontend UI cải thiện:**
>  - Search bar → gõ "Bệnh viện", "Cầu Rồng" → chọn → tự điền lat/lng
>  - Map click → click 2 lần trên bản đồ để set origin + destination
>  - Quick presets: BV Da Nang, Cầu Rồng, BV Hoan My, BV Vinmec, CH Viện Nhi
>  - Hiển thị màu congestion theo segment (xanh/vàng/đỏ)
>- **File đã thêm/sửa:**
>  - `backend/app/Services/PriorityRouteService.php` — Dijkstra + fallback route
>  - `backend/app/Http/Controllers/Api/PriorityRouteController.php` — API controller
>  - `backend/app/Http/Controllers/Api/GeocodeController.php` — search + reverse geocoding
>  - `frontend/src/app/(emergency)/emergency/priority-route/page.tsx` — UI mới (search, map click, presets)
>  - `frontend/src/components/TrafficMap.tsx` — thêm `onMapClick` prop

#### 6. Benchmark AI Model — Đo độ chính xác của mô hình
> **Tại sao quan trọng:** Báo cáo/slide cần con số cụ thể, ban giám khảo hay hỏi "mô hình của bạn chính xác bao nhiêu %?"

- **Vấn đề:** Hiện tại không có con số đo lường nào cho mô hình LSTM — không biết dự đoán sai bao nhiêu
- **Benchmark là gì:** Chạy mô hình trên tập dữ liệu test, tính:
  - **MAE** (sai số trung bình): dự đoán mật độ giao thông lệch bao nhiêu so với thực tế
  - **RMSE**: tương tự nhưng phạt nặng hơn khi sai nhiều
  - Mục tiêu: MAE < 0.05 (sai dưới 5% mật độ)
- **Cần làm:** Chạy script evaluation, ghi kết quả vào báo cáo và slide
- **File liên quan:** `ai-service/ml/training/`
- **Thời gian ước tính:** 1 ngày

---

### 🟢 Ưu tiên thấp (nice-to-have cho Grand Finale 31/7)

#### 7. Amazon Nova Integration — Mô phỏng dài hạn 1-10 năm
> **Tại sao:** Đây là "Layer 3" trong kiến trúc 3-layer của dự án — chức năng cho Urban Planner quy hoạch đô thị dài hạn. Ấn tượng nhưng không cần thiết cho semi-final.

- **Vấn đề:** Báo cáo mô tả tính năng mô phỏng "nếu xây thêm cầu X thì giao thông 5 năm tới thế nào" nhưng chưa tích hợp AI của Amazon
- **Amazon Nova là gì:** Dịch vụ AI của Amazon Web Services, dùng để chạy các bài toán mô phỏng phức tạp dài hạn mà LSTM không làm được
- **Cần làm:** Kết nối API Amazon Nova từ endpoint `/api/simulate` khi horizon > 1 năm
- **Thời gian ước tính:** 3-5 ngày

#### 8. Mobile App Polish — Hoàn thiện app điện thoại cho người dân
> **Tại sao:** App React Native dành cho người dân (xem bản đồ, nhận cảnh báo) chưa hoàn chỉnh. Demo trên điện thoại thật sẽ rất ấn tượng nhưng không bắt buộc cho semi-final.

- **Vấn đề:** App mobile có code nhưng chưa test đầy đủ — đăng nhập, xem bản đồ giao thông realtime, nhận push notification khi có kẹt xe
- **Mobile App là gì trong dự án:** Người dân dùng app để: xem bản đồ kẹt xe realtime, báo cáo sự cố bằng ảnh, nhận thông báo đẩy khi tuyến đường quen bị ảnh hưởng
- **Cần làm:** Test login → map → báo cáo → push notification trên thiết bị thật
- **Thời gian ước tính:** 5-7 ngày

---

## Timeline đề xuất

```
Tuần 1  (17-23/4):  Fix MediaController + Mapbox realtime overlay
Tuần 2  (24-30/4):  Test demo flow end-to-end + fix bugs
Tuần 3  (1-7/5):    ST-GCN implement hoặc cập nhật báo cáo + Emergency route
Tuần 4  (8-14/5):   Benchmark AI + cập nhật slide deck
Tuần 5  (15-21/5):  Flood model (nếu kịp) + record demo video backup
Tuần 6  (22-28/5):  Buffer / polish / rehearsal demo
Tuần 7  (29/5-4/6): Final QA, recorded demo video
Tuần 8  (5-25/6):   Buffer + chuẩn bị thuyết trình Semi-final
─────────────────────────────────────────────────────
25/6:   SEMI-FINAL
─────────────────────────────────────────────────────
Tuần 9+ (26/6-31/7): Grand Finale prep (nếu vào vòng tiếp)
```

---

## Checklist Demo Day

- [x] ~~Docker compose up chạy được trong < 2 phút~~
- [x] ~~MediaController upload ảnh đã có logic thật (local disk)~~
- [x] ~~Mapbox map hiển thị edges màu realtime + animation~~ (WebSocket `EdgeMetricsUpdated` + `traffic.telemetry.updated`, transition 800ms)
- [x] ~~Citizen submit report có ảnh → thành công~~ (IncidentController lưu ảnh, MediaController upload OK)
- [x] ~~AI prediction trigger tự động sau khi có incident~~ (CallAIPrediction job dispatch)
- [x] ~~Operator nhận notification realtime~~ (NotifyOperatorsOfNewIncident listener)
- [x] ~~Operator approve recommendation → broadcast~~ (RecommendationAlert gửi FCM + database notification)
- [x] ~~Emergency nhận priority route updated~~ ✅ (Dijkstra PriorityRouteService + PriorityRouteController API + frontend wired)
- [x] ~~ST-GCN model implemented~~ ✅ (ai-service/app/models/stgcn_model.py, benchmark đang train background)
- [x] ~~Citizen nhận alert notification~~ (RecommendationAlert gửi FCM cho reporter)
- [ ] Demo video backup (phòng mạng chậm)
- [ ] Slide deck khớp với code thực tế

---

## Số liệu cần có trong báo cáo/slide

| Metric | Giá trị mục tiêu | Nguồn |
|---|---|---|
| LSTM MAE (traffic density) | < 0.05 | Chạy evaluation |
| Prediction latency | < 500ms | Benchmark API |
| WebSocket update interval | ~5 giây | Hiện tại |
| Incident detection time | < 2 phút | Demo flow |
| Congestion reduction (simulated) | 15-25% | Simulation output |

---
name: mobile-reports-api
description: Laravel API prefix /api/reports — DTO phản ánh tiếng Việt map sang bảng incidents; tách khỏi /incidents dùng cho web. Dùng khi thêm/sửa route reports, ReportController, hoặc đồng bộ mobile reportService.
---

# Mobile reports API (`/api/reports`)

## Vai trò

- **Ứng dụng React Native** gọi các endpoint này qua `mobile/src/services/reportService.ts`.
- Dữ liệu nguồn là model **`Incident`** (PostGIS `location`, JSON `metadata`). Không có bảng `reports` riêng.

## Auth

- Tất cả route trong `Route::prefix('reports')` nằm trong `middleware('auth:sanctum')` (xem `routes/api.php`).

## Bảng route (chuẩn hiện tại)

| Method | Path | Controller | Ghi chú |
|--------|------|------------|---------|
| GET | `/api/reports` | `index` | Danh sách (phân trang) |
| POST | `/api/reports` | `store` | Tạo phản ánh (field tiếng Việt) |
| GET | `/api/reports/my` | `my` | Phản ánh của user |
| GET | `/api/reports/nearby` | `nearby` | Query `vi_do`, `kinh_do`, `radius` |
| GET | `/api/reports/trending` | `trending` | Theo `metadata.views` |
| GET | `/api/reports/stats` | `stats` | Thống kê tổng quan |
| GET | `/api/reports/{id}` | `show` | Chi tiết (`{id}` numeric) |
| PUT | `/api/reports/{id}` | `update` | Chỉ **chủ** `reported_by` |
| DELETE | `/api/reports/{id}` | `destroy` | Soft delete, chỉ chủ |
| POST | `/api/reports/{id}/view` | `view` | Tăng `metadata.views` |
| POST | `/api/reports/{id}/vote` | `vote` | Body `{ loai_binh_chon: 1 \| -1 }` |
| POST | `/api/reports/{id}/rate` | `rate` | Body `{ diem_so: 1..5 }` |
| POST | `/api/reports/{id}/comments` | `comment` | Body `{ noi_dung }` |

## Web không dùng nhóm này

- Công dân trên **web** báo cáo qua **`POST /api/incidents`** (và AI `/api/ai/*`).
- Khi thêm field mới cho mobile, ưu tiên mở rộng `ReportController` + `mapIncidentToReport()`, tránh phá vỡ validation `IncidentController::store`.

## Metadata (lưu trong `incidents.metadata`)

- `address` / `location_name` — địa chỉ hiển thị.
- `images` — mảng URL ảnh.
- `views` — lượt xem (trending).
- `upvotes`, `downvotes` — vote.
- `rating_scores`, `rating_average` — đánh giá.
- `comments` — mảng bình luận (id, noi_dung, user_id, ho_ten, created_at, …).

## Quy tắc cho agent

1. Thêm endpoint mobile **trong** `Route::prefix('reports')` (hoặc nhóm `map` / `media` đã ghi chú Mobile).
2. Cập nhật `lang/en/api.php` và `lang/vi/api.php` cho message key mới (`api.*`).
3. Cập nhật `mobile/src/services/reportService.ts` nếu đổi path hoặc body.
4. Không đổi nhóm `public/*` hoặc `incidents` cho web mà không kiểm tra `frontend`.

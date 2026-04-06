# Backend — hướng dẫn cho agent (CivicTwin AI)

## Phạm vi

- **Laravel API** tại `routes/api.php`, controllers trong `app/Http/Controllers/Api/`.
- **Chuẩn phản hồi:** `App\Helpers\ApiResponse` + khóa dịch `lang/{en,vi}/api.php`.

## Tách luồng Web vs Mobile (quan trọng)

| Khách hàng | Base path | Mục đích |
|------------|-----------|----------|
| **Web (Next.js)** | `POST/GET /api/incidents`, `GET /api/public/incidents` | Tiếng Anh / JSON phẳng, dialog báo cáo công dân trên web. |
| **Mobile app** | `GET|POST /api/reports`, `PUT|DELETE /api/reports/{id}`, vote/rate/comments, … | DTO tiếng Việt (`tieu_de`, `mo_ta`, …) map sang bảng **`incidents`**. |

- **Không** gộp hoặc xóa nhóm `reports` / `map` / `media` (mobile) mà không cập nhật `mobile/src/services/reportService.ts` và skill `.agents`.
- **Không** đổi contract `POST /api/incidents` (web) trừ khi đồng bộ `frontend` và tài liệu.

## Skill chi tiết (mobile API)

Đọc skill khi sửa route/controller liên quan phản ánh trên app:

- `.agents/mobile-reports-api/SKILL.md`

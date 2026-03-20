# Multi-Actor Isolation Pattern

> Khái niệm phân tách trải nghiệm người dùng theo vai trò (Multi-Actor/Multi-Role) được đúc kết từ dự án thể thao đa người dùng (SportStore).

## Bài toán
Trong một hệ thống như CivicTwinAI hoặc E-commerce, khi có nhiều hơn 2 vai trò truy cập ứng dụng (ví dụ: `Admin`, `Operator`, `Citizen`, `AI Specialist`), nếu dùng chung một Frontend Layout và check roles bằng condition `if/else`, code sẽ phình to (Bloated Sidebar), dễ lộ logic ẩn và khó mở rộng theo chiều dọc.

## Giải pháp (Pattern)

### 1. Ở Frontend (Next.js App Router)
Sử dụng **Route Groups** `(folder)` kết hợp với Layout riêng biệt. 
Cấu trúc Thư mục:
```text
src/app/
 ├── (auth)/
 │    └── layout.tsx         # Blank Layout
 ├── (operator)/
 │    ├── dashboard/
 │    └── layout.tsx         # Sidebar Operator & Kiểm tra Auth (Role === operator)
 ├── (admin)/
 │    ├── users/
 │    └── layout.tsx         # Sidebar Admin & Kiểm tra Auth (Role === admin)
 └── (public)/
      ├── map/
      └── layout.tsx         # Header Public Navigation
```
=> **Lợi ích:** Module hóa giao diện triệt để. Admin không bao giờ tải Sidebar Component của Operator. Quản lý trạng thái xác thực cục bộ ở Layout cấp 1.

### 2. Ở Backend (Laravel / Node API)
Không dùng chung Route và kiểm tra quyền trong Controller. Cần áp đặt Role Middleware ở tầng Navigation/Route.
```php
// Tách API Prefix tương ứng với Route Group Frontend
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function() {
    // Chỉ Admin mới chọc vào được các API này
    Route::apiResource('users', NguoiDungAdminController::class);
});

Route::prefix('operator')->middleware(['auth:sanctum', 'role:operator'])->group(function() {
    // API điều hành hệ thống
});
```

## Khi nào áp dụng
- Hệ thống SaaS, Dashboard, ERP, Command Center có từ 2 Actors trở lên với giao diện hoàn toàn khác biệt.
- Yêu cầu bảo mật cấp cao, chống User thường gọi API của Admin.

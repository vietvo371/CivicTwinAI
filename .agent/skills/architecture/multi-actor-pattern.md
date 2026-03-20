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

## 5. Cạm bẫy phổ biến (Pitfalls) khi triển khai Đa Actor
- **Lag Sync Context (Auth State):** Frontend SPA (React/Next.js) DỄ dính lỗi Redirect Loop nếu Login Page gọi trực tiếp API `/auth/login` thay vì gọi thông qua Global Context (`useAuth()`). Khi nhảy trang Client-side sang `/dashboard`, Guard Frontend sẽ lập tức active, nhưng biến State chưa kịp đồng bộ => đẩy người dùng ra `/unauthorized`. **Must-do:** Hàm Login của bất kỳ App nào CŨNG phải update Global State chứa `roles` trước khi `router.push()`. 
- **Quên Super Admin Override:** Ở các file `layout.tsx` kiểm duyệt quyền (VD: Operator Guard), Lập trình viên hay check `user.roles.includes('operator')` mà quên thêm `|| user.roles.includes('super_admin')`. Hậu quả: Super Admin (Người cao nhất) lại bị chặn ở các màn hình quản trị. Luôn nhớ thêm Bypass Role cho Super Admin vào mọi Guard.
- **Che UI chưa đủ:** Route Groups của Next.js chỉ "chia luồng", KHÔNG có tính năng bảo mật. Middleware Backend (Laravel) check Role trên TỪNG API là bắt buộc để ngăn chặn cào dữ liệu trái phép (Postman).
- **Spatie Guard Mismatch (Cực kỳ nguy hiểm):** Khi build API-only với `Sanctum` nhưng dùng Spatie Permission, Seeder mặc định tạo Roles dưới Guard là `web`. Khi gắn middleware kiểm tra API (`middleware('role:admin')`), Spatie sẽ lấy Role của User *nhưng tự động lọc theo Guard đang dùng (sanctum)* -> Kết quả là hàm trả về rỗng, nhả lỗi `UnauthorizedException` mặc dù User có quyền. **Giải quyết:** Luôn thêm `protected $guard_name = 'sanctum';` vào Model User và explicitly gán `'guard_name' => 'sanctum'` khi Seed Roles.

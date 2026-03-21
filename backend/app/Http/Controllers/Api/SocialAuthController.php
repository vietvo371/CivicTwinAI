<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Chuyển hướng người dùng sang trang đăng nhập của Google
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Nhận callback từ Google, lấy thông tin user và đăng nhập/đăng ký
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            // Tìm user theo email
            $user = User::where('email', $googleUser->email)->first();

            if ($user) {
                // Đã có account, cập nhật lại provider info nếu nó đang null
                if (!$user->provider_id) {
                    $user->update([
                        'provider' => 'google',
                        'provider_id' => $googleUser->id,
                        'avatar' => $googleUser->avatar ?? $user->avatar,
                    ]);
                }
            } else {
                // Tạo mới User
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'provider' => 'google',
                    'provider_id' => $googleUser->id,
                    'avatar' => $googleUser->avatar ?? null,
                    'password' => null, // Google auth không cần password
                    'is_active' => true,
                ]);

                // Mặc định gán quyền citizen (Giả định có role này)
                if (method_exists($user, 'assignRole')) {
                    try {
                        $user->assignRole('citizen');
                    } catch (\Exception $e) {
                        Log::error("Failed to assign citizen role: " . $e->getMessage());
                    }
                }
            }

            // Sinh Token đăng nhập
            $user->update(['last_login_at' => now()]);
            $token = $user->createToken('auth_token')->plainTextToken;

            // Xử lý chuyển hướng ngược về Frontend
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            return redirect($frontendUrl . '/auth/callback?token=' . $token);

        } catch (\Exception $e) {
            Log::error("Google Login Error: " . $e->getMessage());
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            return redirect($frontendUrl . '/login?error=' . urlencode(__('api.google_login_failed')));
        }
    }
}

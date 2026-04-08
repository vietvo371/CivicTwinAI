<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Notifications\SendOtpNotification;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('api.invalid_credentials')],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => [__('api.account_deactivated')],
            ]);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return ApiResponse::success([
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 'api.login_success');
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'phone' => $request->phone,
        ]);

        $user->assignRole('citizen');

        $token = $user->createToken('auth-token')->plainTextToken;

        return ApiResponse::created([
            'user' => $this->formatUser($user),
            'token' => $token,
        ], 'api.register_success');
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success([
            'user' => $this->formatUser($request->user()),
        ], 'api.profile_retrieved');
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $request->user()->update($validated);

        return ApiResponse::success([
            'user' => $this->formatUser($request->user()->fresh()),
        ], 'api.profile_updated');
    }

    public function updateFcmToken(Request $request): JsonResponse
    {
        $request->validate([
            'fcm_token' => 'present|nullable|string|max:4096',
        ]);

        $raw = $request->input('fcm_token');
        $request->user()->update([
            'fcm_token' => ($raw === null || $raw === '') ? null : $raw,
        ]);

        return ApiResponse::success(null, 'api.fcm_token_updated');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => [__('api.incorrect_password')],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return ApiResponse::success(null, 'api.password_changed');
    }

    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        return ApiResponse::success(['token' => $token], 'api.token_refreshed');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'api.logout_success');
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required_without:username|email',
            'username' => 'required_without:email|email',
        ]);

        $email = $request->email ?? $request->username;

        $user = User::where('email', $email)->first();
        if (! $user) {
            return ApiResponse::success(null, 'Nếu email hợp lệ, hệ thống sẽ gửi mã OTP đến email của bạn.');
        }

        $otp = sprintf("%06d", mt_rand(1, 999999));

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($otp),
                'created_at' => now(),
            ]
        );

        $user->notify(new SendOtpNotification($otp));

        return ApiResponse::success(null, 'Mã OTP đã được gửi đến email của bạn.');
    }

    public function acceptOtpPassword(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        $email = $request->username;
        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $record || ! Hash::check($request->otp, $record->token)) {
            // Fake or error?
            return response()->json([
                'status' => false,
                'message' => 'Mã OTP không hợp lệ hoặc không tồn tại.'
            ], 400);
        }

        if (now()->diffInMinutes($record->created_at) > 5) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json([
                'status' => false,
                'message' => 'Mã OTP đã hết hạn (chỉ có hiệu lực trong 5 phút).'
            ], 400); 
        }

        $resetToken = Str::uuid()->toString();

        DB::table('password_reset_tokens')->where('email', $email)->update([
            'token' => Hash::make($resetToken), // Hash security
            'created_at' => now(),
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Xác minh thành công, vui lòng tạo mật khẩu mới.',
            'data' => ['token' => $resetToken],
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'token' => 'required|string',
                'mat_khau' => 'required|string|min:6|confirmed',
            ]);
        } catch (ValidationException $e) {
             return response()->json([
                 'success' => false,
                 'message' => 'Dữ liệu không hợp lệ',
                 'errors' => $e->errors()
             ], 422);
        }

        $record = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if (! $record || ! Hash::check($request->token, $record->token) || now()->diffInMinutes($record->created_at) > 10) {
            return response()->json([
                'success' => false,
                'message' => 'Phiên đổi mật khẩu không hợp lệ hoặc đã hết hạn.'
            ], 400);
        }

        $user = User::where('email', $request->email)->first();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Người dùng không tồn tại.'
            ], 400);
        }

        $user->update([
            'password' => Hash::make($request->mat_khau),
        ]);

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mật khẩu đã được đặt lại thành công.'
        ]);
    }

    private function formatUser(User $user): array
    {
        $user->load('roles.permissions');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => $user->avatar,
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at,
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }
}

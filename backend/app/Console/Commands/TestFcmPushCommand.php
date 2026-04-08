<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\FcmPushService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class TestFcmPushCommand extends Command
{
    protected $signature = 'app:test-fcm-push {user : ID user (users.id) đã có fcm_token} {--title=Test BE} {--body=Push thử từ Laravel}';

    protected $description = 'Gửi một tin FCM thử nghiệm tới user (token trong DB)';

    public function handle(FcmPushService $fcm): int
    {
        if (! config('services.fcm.enabled')) {
            $this->error('FCM tắt. Đặt FCM_ENABLED=true trong .env và cấu hình FIREBASE_CREDENTIALS.');

            return self::FAILURE;
        }

        $userId = (int) $this->argument('user');
        $user = User::query()->find($userId);

        if (! $user) {
            $this->error("Không tìm thấy user id={$userId}.");

            return self::FAILURE;
        }

        $token = $user->fcm_token;
        if (! is_string($token) || $token === '') {
            $this->error("User #{$userId} chưa có fcm_token. Mở app, đăng nhập và cấp quyền thông báo.");

            return self::FAILURE;
        }

        // In trực tiếp để copy test bằng Firebase Console (Cloud Messaging composer).
        $this->newLine();
        $this->info("FCM token của user #{$userId}:");
        $this->line($token);
        $this->newLine();
        Log::info('fcm.test_command_token', [
            'user_id' => $userId,
            'token' => $token,
        ]);

        $title = (string) $this->option('title');
        $body = (string) $this->option('body');

        $ok = $fcm->sendToToken($token, $title, $body, [
            'type' => 'test',
            'source' => 'laravel',
        ]);

        if ($ok) {
            $this->info('Đã gửi FCM thành công (kiểm tra thiết bị / log storage).');

            return self::SUCCESS;
        }

        $this->warn('Gửi FCM thất bại — xem log Laravel (fcm.send_failed).');

        return self::FAILURE;
    }
}


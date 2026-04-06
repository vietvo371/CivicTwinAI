<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\FcmPushService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:test-fcm-push {user : ID user (users.id) đã có fcm_token} {--title=Test BE} {--body=Push thử từ Laravel}')]
#[Description('Gửi một tin FCM thử nghiệm tới user (token trong DB)')]
class TestFcmPushCommand extends Command
{

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


<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\Channels\FcmChannel;
use App\Services\FcmPushService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Queue\InteractsWithQueue;

/**
 * B3: Mọi notification chỉ ghi database (không có FcmChannel) vẫn được gửi FCM tới user có token.
 */
class MirrorDatabaseNotificationToFcm implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly FcmPushService $fcm,
    ) {}

    public function handle(NotificationSent $event): void
    {
        if ($event->channel !== 'database') {
            return;
        }

        $notifiable = $event->notifiable;
        if (! $notifiable instanceof User) {
            return;
        }

        $notification = $event->notification;
        $via = $notification->via($notifiable);
        if (in_array(FcmChannel::class, $via, true)) {
            return;
        }

        $token = $notifiable->fcm_token ?? '';
        if (! is_string($token) || $token === '') {
            return;
        }

        if (! method_exists($notification, 'toArray')) {
            return;
        }

        /** @var array<string, mixed> $data */
        $data = $notification->toArray($notifiable);

        $title = (string) ($data['title'] ?? $data['tieu_de'] ?? 'Thông báo');
        $body = (string) ($data['message'] ?? $data['noi_dung'] ?? '');

        $stringData = [
            'type' => (string) ($data['type'] ?? 'system'),
        ];
        foreach ($data as $key => $value) {
            if (in_array($key, ['title', 'message', 'tieu_de', 'noi_dung', 'type', 'metadata'], true)) {
                continue;
            }
            $k = (string) $key;
            if ($k === '') {
                continue;
            }
            try {
                $stringData[$k] = is_scalar($value) || $value === null
                    ? (string) $value
                    : json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
            } catch (\JsonException) {
                $stringData[$k] = '';
            }
        }

        if ($body === '') {
            $body = 'Bạn có thông báo mới';
        }

        $this->fcm->sendToToken($token, $title, $body, $stringData);
    }
}

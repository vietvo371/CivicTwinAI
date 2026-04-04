<?php

namespace App\Notifications\Channels;

use App\Services\FcmPushService;
use Illuminate\Notifications\Notification;

final class FcmChannel
{
    public function __construct(
        private readonly FcmPushService $fcm,
    ) {}

    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toFcm')) {
            return;
        }

        $token = $notifiable->fcm_token ?? null;
        if (! is_string($token) || $token === '') {
            return;
        }

        /** @var array{title?: string, body?: string, data?: array<string, mixed>} $payload */
        $payload = $notification->toFcm($notifiable);

        $this->fcm->sendToToken(
            $token,
            (string) ($payload['title'] ?? ''),
            (string) ($payload['body'] ?? ''),
            $payload['data'] ?? [],
        );
    }
}

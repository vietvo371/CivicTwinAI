<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Laravel\Firebase\Facades\Firebase;

final class FcmPushService
{
    /**
     * @param  array<string, mixed>  $data  FCM yêu cầu giá trị data là string — sẽ ép kiểu
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        if (! config('services.fcm.enabled')) {
            return false;
        }

        if ($token === '') {
            return false;
        }

        $stringData = [];
        foreach ($data as $key => $value) {
            $k = (string) $key;
            if ($k === '') {
                continue;
            }
            $stringData[$k] = is_scalar($value) || $value === null
                ? (string) $value
                : json_encode($value, JSON_THROW_ON_ERROR);
        }

        try {
            $message = CloudMessage::new()
                ->withToken($token)
                ->withNotification(Notification::create($title, $body))
                ->withData($stringData);

            Firebase::messaging()->send($message);

            return true;
        } catch (\Throwable $e) {
            Log::warning('fcm.send_failed', [
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}

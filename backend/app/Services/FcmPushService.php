<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Laravel\Firebase\Facades\Firebase;

final class FcmPushService
{
    private function resolveCredentialPath(string $path): string
    {
        if ($path === '') {
            return '';
        }

        // Absolute UNIX path
        if (str_starts_with($path, '/')) {
            return $path;
        }

        // Absolute Windows path (for local dev)
        if (preg_match('/^[A-Za-z]:\\\\/', $path) === 1) {
            return $path;
        }

        return base_path($path);
    }

    private function maskToken(string $token): string
    {
        if ($token === '') {
            return '';
        }

        $len = strlen($token);
        if ($len <= 16) {
            return str_repeat('*', $len);
        }

        return substr($token, 0, 8).'...'.substr($token, -8);
    }

    /**
     * @param  array<string, mixed>  $data  FCM yêu cầu giá trị data là string — sẽ ép kiểu
     */
    public function sendToToken(string $token, string $title, string $body, array $data = []): bool
    {
        $enabled = (bool) config('services.fcm.enabled');
        $credentialPath = (string) config('firebase.projects.app.credentials');
        $resolvedCredentialPath = $this->resolveCredentialPath($credentialPath);

        if (! $enabled) {
            Log::info('fcm.skip_disabled', [
                'enabled' => false,
            ]);
            return false;
        }

        if ($token === '') {
            Log::warning('fcm.skip_empty_token');
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

        Log::info('fcm.send_attempt', [
            'token' => $this->maskToken($token),
            'title_len' => strlen($title),
            'body_len' => strlen($body),
            'data_keys' => array_keys($stringData),
            'enabled' => $enabled,
            'credentials_path' => $credentialPath,
            'credentials_path_resolved' => $resolvedCredentialPath,
            'credentials_readable' => $resolvedCredentialPath !== '' ? is_readable($resolvedCredentialPath) : null,
        ]);

        try {
            $message = CloudMessage::new()
                ->toToken($token)
                ->withNotification(Notification::create($title, $body))
                ->withData($stringData);

            Firebase::messaging()->send($message);

            Log::info('fcm.send_ok', [
                'token' => $this->maskToken($token),
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::warning('fcm.send_failed', [
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace_top' => array_slice(explode("\n", $e->getTraceAsString()), 0, 5),
                'token' => $this->maskToken($token),
                'data_keys' => array_keys($stringData),
                'credentials_path' => $credentialPath,
                'credentials_path_resolved' => $resolvedCredentialPath,
                'credentials_readable' => $resolvedCredentialPath !== '' ? is_readable($resolvedCredentialPath) : null,
            ]);

            return false;
        }
    }
}

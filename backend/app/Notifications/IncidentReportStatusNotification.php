<?php

namespace App\Notifications;

use App\Models\Incident;
use App\Notifications\Channels\FcmChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class IncidentReportStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Incident $incident,
        protected string $oldStatus,
        protected string $newStatus,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    /**
     * @return array{title: string, body: string, data: array<string, string>}
     */
    public function toFcm(object $notifiable): array
    {
        $title = 'Cập nhật trạng thái';
        $reportTitle = $this->incident->title ?? 'Phản ánh của bạn';
        $body = sprintf(
            '"%s": %s → %s',
            $reportTitle,
            self::statusLabel($this->oldStatus),
            self::statusLabel($this->newStatus)
        );

        return [
            'title' => $title,
            'body' => $body,
            'data' => [
                'type' => 'report_status',
                'report_id' => (string) $this->incident->id,
                'old_status' => $this->oldStatus,
                'new_status' => $this->newStatus,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $reportTitle = $this->incident->title ?? 'Phản ánh của bạn';
        $message = sprintf(
            '"%s": %s → %s',
            $reportTitle,
            self::statusLabel($this->oldStatus),
            self::statusLabel($this->newStatus)
        );

        return [
            'incident_id' => $this->incident->id,
            'title' => 'Cập nhật trạng thái',
            'message' => $message,
            'type' => 'report_status',
            'metadata' => [
                'report_id' => $this->incident->id,
                'old_status' => $this->oldStatus,
                'new_status' => $this->newStatus,
                'report' => $this->incident->toArray(),
            ],
        ];
    }

    public static function statusLabel(string $status): string
    {
        return match ($status) {
            'open' => 'Tiếp nhận',
            'investigating' => 'Đang xử lý',
            'resolved' => 'Hoàn thành',
            'closed' => 'Đã đóng',
            default => $status,
        };
    }
}

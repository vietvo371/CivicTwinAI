<?php

namespace App\Notifications;

use App\Models\Recommendation;
use App\Notifications\Channels\FcmChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RecommendationAlert extends Notification
{
    use Queueable;

    public function __construct(
        protected Recommendation $recommendation,
        protected string $eventType,
        protected ?string $operatorName = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    public function toFcm(object $notifiable): array
    {
        $data = $this->buildPayload();

        return [
            'title' => $data['title'],
            'body' => $data['body'],
            'data' => [
                'type' => $this->eventType,
                'recommendation_id' => (string) $this->recommendation->id,
                'incident_id' => (string) $this->recommendation->incident_id,
                'prediction_id' => (string) ($this->recommendation->prediction_id ?? ''),
                'action_url' => '/recommendations/'.$this->recommendation->id,
            ],
        ];
    }

    public function toArray(object $notifiable): array
    {
        $data = $this->buildPayload();
        $incident = $this->recommendation->incident;

        return [
            'recommendation_id' => $this->recommendation->id,
            'incident_id' => $this->recommendation->incident_id,
            'title' => $data['title'],
            'message' => $data['body'],
            'type' => $this->eventType,
            'metadata' => [
                'recommendation' => $this->recommendation->toArray(),
                'incident' => $incident?->toArray(),
                'operator_name' => $this->operatorName,
            ],
        ];
    }

    private function buildPayload(): array
    {
        $incident = $this->recommendation->incident;
        $incidentTitle = $incident?->title ?? 'Sự cố #'.$this->recommendation->incident_id;
        $recType = $this->recommendation->type ?? 'route_adjustment';
        $typeLabel = self::typeLabel($recType);

        return match ($this->eventType) {
            'recommendation_approved' => [
                'title' => 'Phương án được duyệt: '.$typeLabel,
                'body' => sprintf(
                    '"%s" đã được duyệt bởi %s. Đang chuyển đến đội khẩn cấp.',
                    $incidentTitle,
                    $this->operatorName ?? 'Operator'
                ),
            ],
            'recommendation_rejected' => [
                'title' => 'Phương án bị từ chối: '.$typeLabel,
                'body' => sprintf(
                    '"%s": Phương án đã bị từ chối. Lý do: %s',
                    $incidentTitle,
                    $this->recommendation->rejected_reason ?? 'Không có'
                ),
            ],
            'critical_route_approved' => [
                'title' => 'Cảnh báo: Đường ưu tiên được kích hoạt',
                'body' => sprintf(
                    'Tuyến đường ưu tiên cho xe ưu tiên đã được duyệt: %s. Cập nhật lộ trình ngay.',
                    $incidentTitle
                ),
            ],
            default => [
                'title' => 'Cập nhật phương án xử lý',
                'body' => sprintf('Phương án cho "%s" đã được cập nhật.', $incidentTitle),
            ],
        };
    }

    public static function typeLabel(string $type): string
    {
        return match ($type) {
            'route_adjustment' => 'Điều chỉnh tuyến đường',
            'signal_timing' => 'Thay đổi thời gian đèn tín hiệu',
            'speed_limit' => 'Giới hạn tốc độ',
            'lane_closure' => 'Đóng làn đường',
            'alternative_route' => 'Tuyến đường thay thế',
            'evacuation' => 'Sơ tán',
            default => $type,
        };
    }
}

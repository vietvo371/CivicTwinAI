<?php

namespace App\Notifications;

use App\Notifications\Channels\FcmChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class IncidentAlert extends Notification
{
    use Queueable;

    protected $incident;

    /**
     * Create a new notification instance.
     */
    public function __construct($incident)
    {
        $this->incident = $incident;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', FcmChannel::class];
    }

    /**
     * Payload cho FCM (data values phải là string trên wire — FcmPushService sẽ ép).
     *
     * @return array{title: string, body: string, data: array<string, string>}
     */
    public function toFcm(object $notifiable): array
    {
        $title = $this->incident->title ?? ('Sự cố '.$this->incident->severity);
        $body = $this->incident->description ?? ($this->incident->location_name ?? 'Có sự kiện giao thông mới');

        return [
            'title' => $title,
            'body' => $body,
            'data' => [
                'type' => 'incident_created',
                'incident_id' => (string) $this->incident->id,
            ],
        ];
    }

    /**
     * Get the array representation of the notification for database storage.
     * This matches the format expected by the mobile app.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'incident_id' => $this->incident->id,
            'title' => $this->incident->title ?? ('Sự cố '.$this->incident->severity),
            'message' => $this->incident->description ?? ($this->incident->location_name ?? 'Có sự kiện giao thông mới'),
            'type' => 'incident_created',
            'metadata' => $this->incident->toArray(),
        ];
    }
}

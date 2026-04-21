<?php

namespace App\Events;

use App\Models\Recommendation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RecommendationGenerated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Recommendation $recommendation,
        public string $action = 'approved'
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('traffic'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'RecommendationGenerated';
    }

    public function broadcastWith(): array
    {
        return [
            'id'          => $this->recommendation->id,
            'action'      => $this->action,
            'type'        => $this->recommendation->type,
            'description' => $this->recommendation->description,
            'status'      => $this->recommendation->status,
            'incident_id' => $this->recommendation->incident_id,
        ];
    }
}

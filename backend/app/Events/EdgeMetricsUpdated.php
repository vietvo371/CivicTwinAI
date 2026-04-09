<?php

namespace App\Events;

use App\Models\Edge;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EdgeMetricsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Edge $edge
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('traffic'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'EdgeMetricsUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->edge->id,
            'current_density' => (float) $this->edge->current_density,
            'current_speed_kmh' => (float) $this->edge->current_speed_kmh,
            'current_flow' => (float) $this->edge->current_flow,
            'congestion_level' => $this->edge->congestion_level,
            'status' => $this->edge->status,
            'metrics_updated_at' => $this->edge->metrics_updated_at?->toISOString(),
        ];
    }
}

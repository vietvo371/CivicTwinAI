<?php

namespace App\Events;

use App\Models\Incident;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncidentResolved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Incident $incident,
        public array $restoredEdgeIds = []
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('traffic')];
    }

    public function broadcastAs(): string
    {
        return 'IncidentResolved';
    }

    public function broadcastWith(): array
    {
        return [
            'incident_id'        => $this->incident->id,
            'status'             => $this->incident->status,
            'restored_edge_ids'  => $this->restoredEdgeIds,
            'resolved_at'        => $this->incident->resolved_at?->toISOString(),
        ];
    }
}

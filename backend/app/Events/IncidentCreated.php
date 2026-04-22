<?php

namespace App\Events;

use App\Models\Incident;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IncidentCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Incident $incident
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('traffic'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'IncidentCreated';
    }

    public function broadcastWith(): array
    {
        // Fetch lat/lng from PostGIS if available
        $coords = null;
        try {
            $coords = \Illuminate\Support\Facades\DB::selectOne(
                'SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM incidents WHERE id = ? AND location IS NOT NULL',
                [$this->incident->id]
            );
        } catch (\Throwable) {}

        return [
            'id' => $this->incident->id,
            'title' => $this->incident->title,
            'type' => $this->incident->type,
            'severity' => $this->incident->severity,
            'status' => $this->incident->status,
            'source' => $this->incident->source,
            'location_name' => $this->incident->location_name ?? null,
            'description' => $this->incident->description ?? null,
            'affected_edge_ids' => $this->incident->affected_edge_ids ?? [],
            'latitude' => $coords?->lat,
            'longitude' => $coords?->lng,
            'created_at' => $this->incident->created_at->toISOString(),
        ];
    }
}

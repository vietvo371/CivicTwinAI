<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class TrafficDensityDecayed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function broadcastOn(): array
    {
        return [new Channel('traffic')];
    }

    public function broadcastAs(): string
    {
        return 'TrafficDensityDecayed';
    }

    public function broadcastWith(): array
    {
        // Send lightweight edge metrics snapshot (not full GeoJSON)
        $edges = DB::table('edges')
            ->whereNull('deleted_at')
            ->select('id', 'current_density', 'current_speed_kmh', 'congestion_level')
            ->get()
            ->map(fn ($e) => [
                'id'               => $e->id,
                'current_density'  => (float) $e->current_density,
                'current_speed_kmh'=> (float) $e->current_speed_kmh,
                'congestion_level' => $e->congestion_level,
            ]);

        return ['edges' => $edges];
    }
}

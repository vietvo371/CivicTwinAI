<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TrafficDensityUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public array $telemetryBatch)
    {}

    public function broadcastOn(): array
    {
        return [
            new Channel('traffic'),
        ];
    }
    
    public function broadcastAs(): string
    {
        return 'traffic.telemetry.updated';
    }
}

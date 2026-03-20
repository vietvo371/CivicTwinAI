<?php

namespace App\Events;

use App\Models\Prediction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PredictionReceived implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Prediction $prediction
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('traffic'),
        ];
    }

    public function broadcastWith(): array
    {
        $this->prediction->load('predictionEdges');

        return [
            'id' => $this->prediction->id,
            'incident_id' => $this->prediction->incident_id,
            'model_version' => $this->prediction->model_version,
            'status' => $this->prediction->status,
            'edges' => $this->prediction->predictionEdges->map(fn ($pe) => [
                'edge_id' => $pe->edge_id,
                'time_horizon_minutes' => $pe->time_horizon_minutes,
                'predicted_density' => (float) $pe->predicted_density,
                'confidence' => (float) $pe->confidence,
                'severity' => $pe->severity,
            ]),
        ];
    }
}

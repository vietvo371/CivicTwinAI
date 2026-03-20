<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TrafficAutoDetector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SensorDataController extends Controller
{
    public function __construct(
        private TrafficAutoDetector $autoDetector
    ) {}

    /**
     * Receive sensor data and process it.
     * This endpoint simulates what Kafka consumer would do.
     */
    public function ingest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'edge_id' => 'required|integer|exists:edges,id',
            'vehicle_count' => 'required|integer|min:0',
            'avg_speed_kmh' => 'required|numeric|min:0|max:200',
            'occupancy_pct' => 'nullable|numeric|min:0|max:100',
        ]);

        $this->autoDetector->processEdgeUpdate(
            $validated['edge_id'],
            $validated
        );

        return response()->json([
            'message' => 'Sensor data processed.',
        ]);
    }

    /**
     * Batch ingest from multiple sensors.
     */
    public function batchIngest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'readings' => 'required|array|min:1',
            'readings.*.edge_id' => 'required|integer|exists:edges,id',
            'readings.*.vehicle_count' => 'required|integer|min:0',
            'readings.*.avg_speed_kmh' => 'required|numeric|min:0|max:200',
        ]);

        $processed = 0;

        foreach ($validated['readings'] as $reading) {
            $this->autoDetector->processEdgeUpdate(
                $reading['edge_id'],
                $reading
            );
            $processed++;
        }

        return response()->json([
            'message' => "{$processed} readings processed.",
            'count' => $processed,
        ]);
    }
}

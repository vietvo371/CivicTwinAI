<?php

namespace App\Jobs;

use App\Models\Incident;
use App\Models\Prediction;
use App\Models\PredictionEdge;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CallAIPrediction implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 5;

    public function __construct(
        public Incident $incident
    ) {}

    public function handle(): void
    {
        $affectedEdgeIds = DB::selectOne(
            'SELECT affected_edge_ids FROM incidents WHERE id = ?',
            [$this->incident->id]
        );

        $edgeIds = $affectedEdgeIds?->affected_edge_ids
            ? array_filter(
                array_map('intval', explode(',', trim($affectedEdgeIds->affected_edge_ids, '{}'))),
                fn ($id) => $id > 0
              )
            : [];

        // Auto-find nearby edges if none specified
        if (empty($edgeIds)) {
            $nearbyEdges = DB::select(
                "SELECT e.id FROM edges e, incidents i
                 WHERE i.id = ? AND i.location IS NOT NULL
                 AND ST_DWithin(e.geometry::geography, i.location::geography, 500)
                 ORDER BY ST_Distance(e.geometry::geography, i.location::geography)
                 LIMIT 5",
                [$this->incident->id]
            );

            $edgeIds = array_map(fn ($row) => $row->id, $nearbyEdges);
        }

        // Fallback: pick random edges if still empty (no location on incident)
        if (empty($edgeIds)) {
            $randomEdges = DB::select('SELECT id FROM edges ORDER BY RANDOM() LIMIT 3');
            $edgeIds = array_map(fn ($row) => $row->id, $randomEdges);
        }

        if (empty($edgeIds)) {
            Log::warning("Incident #{$this->incident->id}: no edges found at all, skipping.");
            return;
        }

        $aiUrl = config('services.ai.url', 'http://localhost:8001');
        $timeout = config('services.ai.timeout', 10);

        try {
            $response = Http::timeout($timeout)->post("{$aiUrl}/api/predict", [
                'incident_id' => $this->incident->id,
                'severity' => $this->incident->severity,
                'affected_edge_ids' => $edgeIds,
            ]);

            if (! $response->successful()) {
                throw new \RuntimeException("AI service returned {$response->status()}");
            }

            $data = $response->json();

            $prediction = Prediction::create([
                'incident_id' => $this->incident->id,
                'model_version' => $data['model_version'] ?? 'unknown',
                'processing_time_ms' => $data['processing_time_ms'] ?? null,
                'status' => 'completed',
            ]);

            // Deduplicate: keep only shortest time_horizon per edge_id
            $grouped = [];
            foreach ($data['predictions'] ?? [] as $pred) {
                $eid = $pred['edge_id'];
                if (!isset($grouped[$eid]) || $pred['time_horizon_minutes'] < $grouped[$eid]['time_horizon_minutes']) {
                    $grouped[$eid] = $pred;
                }
            }

            foreach ($grouped as $pred) {
                PredictionEdge::create([
                    'prediction_id' => $prediction->id,
                    'edge_id'       => $pred['edge_id'],
                    'time_horizon_minutes' => $pred['time_horizon_minutes'],
                    'predicted_density'    => $pred['predicted_density'],
                    'predicted_delay_s'    => $pred['predicted_delay_s'],
                    'confidence'           => $pred['confidence'],
                    'severity'             => $pred['severity'],
                ]);
            }

            Log::info("Prediction created for incident #{$this->incident->id}", [
                'prediction_id' => $prediction->id,
                'edges_predicted' => count($data['predictions'] ?? []),
            ]);

            // Broadcast prediction result to dashboard
            \App\Events\PredictionReceived::dispatch($prediction);

            // Auto-generate recommendations based on prediction
            app(\App\Services\RecommendationGenerator::class)->generate($prediction);

        } catch (\Exception $e) {
            Log::error("AI prediction failed for incident #{$this->incident->id}: {$e->getMessage()}");

            Prediction::create([
                'incident_id' => $this->incident->id,
                'model_version' => 'failed',
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}

<?php

namespace App\Services;

use App\Events\EdgeMetricsUpdated;
use App\Events\IncidentCreated;
use App\Jobs\CallAIPrediction;
use App\Models\Edge;
use App\Models\Incident;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TrafficAutoDetector
{
    /**
     * Process sensor data and update edge metrics.
     * Auto-detect incidents based on anomaly rules.
     */
    public function processEdgeUpdate(int $edgeId, array $data): void
    {
        $edge = Edge::findOrFail($edgeId);

        $density = $this->calculateDensity(
            $data['vehicle_count'],
            $edge->length_m,
            $edge->lanes
        );

        $speedRatio = $edge->speed_limit_kmh > 0
            ? $data['avg_speed_kmh'] / $edge->speed_limit_kmh
            : 1.0;

        $flow = $density * $data['avg_speed_kmh'];
        $congestionLevel = $this->classifyCongestion($density, $speedRatio);

        $oldDensity = (float) $edge->current_density;
        $oldStatus = $edge->status;

        $edge->update([
            'current_density' => $density,
            'current_speed_kmh' => $data['avg_speed_kmh'],
            'current_flow' => $flow,
            'congestion_level' => $congestionLevel,
            'status' => $this->determineStatus($congestionLevel, $oldStatus),
            'metrics_updated_at' => now(),
        ]);

        EdgeMetricsUpdated::dispatch($edge);

        $this->checkAutoDetectRules($edge, $oldDensity, $density, $data['avg_speed_kmh']);
    }

    private function calculateDensity(int $vehicleCount, float $lengthM, int $lanes): float
    {
        if ($lengthM <= 0 || $lanes <= 0) {
            return 0;
        }
        return min($vehicleCount / ($lengthM * $lanes), 1.0);
    }

    private function classifyCongestion(float $density, float $speedRatio): string
    {
        if ($density < 0.3 && $speedRatio > 0.7) return 'none';
        if ($density < 0.5 || $speedRatio > 0.5) return 'light';
        if ($density < 0.7 || $speedRatio > 0.3) return 'moderate';
        if ($density < 0.9 || $speedRatio > 0.1) return 'heavy';
        return 'gridlock';
    }

    private function determineStatus(string $congestionLevel, string $currentStatus): string
    {
        if (in_array($currentStatus, ['blocked', 'closed'])) {
            return $currentStatus;
        }

        return in_array($congestionLevel, ['heavy', 'gridlock'])
            ? 'congested'
            : 'normal';
    }

    /**
     * Auto-detection rules from business-logic.md
     */
    private function checkAutoDetectRules(Edge $edge, float $oldDensity, float $newDensity, float $speed): void
    {
        // Rule 1: Density spike > 0.3 in short period
        $densityJump = $newDensity - $oldDensity;
        if ($densityJump > 0.3 && $speed < ($edge->speed_limit_kmh * 0.5)) {
            $this->createAutoIncident(
                $edge,
                'congestion',
                $newDensity > 0.7 ? 'high' : 'medium',
                "Density tăng đột biến +{$densityJump} trên {$edge->name}"
            );
            return;
        }

        // Rule 2: Speed near zero + high density
        if ($speed < 5 && $newDensity > 0.8) {
            $this->createAutoIncident(
                $edge,
                'congestion',
                'high',
                "Kẹt cứng: speed={$speed}km/h, density={$newDensity} trên {$edge->name}"
            );
        }
    }

    private function createAutoIncident(Edge $edge, string $type, string $severity, string $title): void
    {
        // Avoid duplicate: check if open incident already exists for this edge
        $existing = Incident::where('status', '!=', 'closed')
            ->where('source', 'auto_detected')
            ->whereRaw("? = ANY(affected_edge_ids)", [$edge->id])
            ->where('created_at', '>', now()->subMinutes(30))
            ->exists();

        if ($existing) {
            return;
        }

        $incident = Incident::create([
            'title' => $title,
            'type' => $type,
            'severity' => $severity,
            'status' => 'open',
            'source' => 'auto_detected',
            'metadata' => [
                'auto_detected_at' => now()->toISOString(),
                'density' => (float) $edge->current_density,
                'speed' => (float) $edge->current_speed_kmh,
            ],
        ]);

        DB::statement(
            'UPDATE incidents SET affected_edge_ids = ? WHERE id = ?',
            ['{' . $edge->id . '}', $incident->id]
        );

        Log::info("Auto-detected incident on edge #{$edge->id}: {$title}");

        IncidentCreated::dispatch($incident);
        CallAIPrediction::dispatch($incident);
    }
}

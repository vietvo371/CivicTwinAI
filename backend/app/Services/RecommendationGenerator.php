<?php

namespace App\Services;

use App\Models\Prediction;
use App\Models\Recommendation;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Lang;

class RecommendationGenerator
{
    /**
     * Generate recommendations based on prediction results.
     * Logic from business-logic.md Luồng 4.
     * 
     * Uses Laravel i18n (lang files) so frontend gets locale-aware text
     * when displaying recommendations via t('recommendations.type.KEY').
     */
    public function generate(Prediction $prediction, string $locale = 'vi'): void
    {
        $prediction->load(['incident', 'predictionEdges']);

        if (! $prediction->incident) {
            return;
        }

        $severity = $prediction->incident->severity;
        $highConfidenceEdges = $prediction->predictionEdges
            ->where('confidence', '>=', 0.5)
            ->where('severity', '!=', 'low');

        if ($highConfidenceEdges->isEmpty()) {
            Log::info("No high-confidence predictions for incident #{$prediction->incident_id}, skipping recommendation.");
            return;
        }

        match ($severity) {
            'critical' => $this->generateCritical($prediction, $highConfidenceEdges, $locale),
            'high' => $this->generateHigh($prediction, $highConfidenceEdges, $locale),
            'medium' => $this->generateMedium($prediction, $highConfidenceEdges, $locale),
            default => null,
        };
    }

    private function generateCritical(Prediction $prediction, $edges, string $locale): void
    {
        $affectedCount = $edges->count();
        $maxDensity = $edges->max('predicted_density');

        // Priority route
        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'priority_route',
            'description' => Lang::get("recommendations.priority_route.description", [
                'count' => $affectedCount,
            ], $locale),
            'details' => [
                'affected_edges' => $edges->pluck('edge_id')->values(),
                'max_predicted_density' => $maxDensity,
                'message_key' => 'recommendations.priority_route.message',
            ],
            'status' => 'pending',
        ]);

        // Emergency alert
        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'alert',
            'description' => Lang::get("recommendations.emergency_alert.description", [], $locale),
            'details' => [
                'message' => Lang::get("recommendations.emergency_alert.message", [], $locale),
                'affected_edges' => $edges->pluck('edge_id')->values(),
                'severity' => 'critical',
            ],
            'status' => 'pending',
        ]);
    }

    private function generateHigh(Prediction $prediction, $edges, string $locale): void
    {
        $affectedEdgeIds = $edges->pluck('edge_id')->values();
        $avgDelay = $edges->avg('predicted_delay_s');
        $affectedCount = $affectedEdgeIds->count();

        // Reroute recommendation
        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'reroute',
            'description' => Lang::get("recommendations.reroute.description", [
                'count' => $affectedCount,
            ], $locale),
            'details' => [
                'affected_edges' => $affectedEdgeIds,
                'estimated_delay_s' => (int) $avgDelay,
            ],
            'status' => 'pending',
        ]);

        // Congestion alert
        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'alert',
            'description' => Lang::get("recommendations.congestion_alert.description", [], $locale),
            'details' => [
                'message' => Lang::get("recommendations.congestion_alert.message", [], $locale),
                'affected_edges' => $affectedEdgeIds,
                'severity' => 'high',
            ],
            'status' => 'pending',
        ]);
    }

    private function generateMedium(Prediction $prediction, $edges, string $locale): void
    {
        // Advisory reroute suggestion
        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'advisory',
            'description' => Lang::get("recommendations.advisory.description", [], $locale),
            'details' => [
                'affected_edges' => $edges->pluck('edge_id')->values(),
                'estimated_delay_s' => (int) $edges->avg('predicted_delay_s'),
                'suggestion_only' => true,
            ],
            'status' => 'pending',
        ]);
    }
}

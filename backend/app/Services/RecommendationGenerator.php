<?php

namespace App\Services;

use App\Models\Prediction;
use App\Models\Recommendation;
use Illuminate\Support\Facades\Log;

class RecommendationGenerator
{
    /**
     * Generate recommendations based on prediction results.
     * Logic from business-logic.md Luồng 4.
     */
    public function generate(Prediction $prediction): void
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
            'critical' => $this->generateCritical($prediction, $highConfidenceEdges),
            'high' => $this->generateHigh($prediction, $highConfidenceEdges),
            'medium' => $this->generateMedium($prediction, $highConfidenceEdges),
            default => null,
        };
    }

    private function generateCritical(Prediction $prediction, $edges): void
    {
        // Priority route + alert
        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'priority_route',
            'description' => 'Kích hoạt tuyến ưu tiên cứu hộ — tránh các đoạn đường bị ảnh hưởng.',
            'details' => [
                'affected_edges' => $edges->pluck('edge_id')->values(),
                'max_predicted_density' => $edges->max('predicted_density'),
            ],
            'status' => 'pending',
        ]);

        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'alert',
            'description' => 'Cảnh báo khẩn cấp cho người dân trong khu vực bị ảnh hưởng.',
            'details' => [
                'message' => '⚠️ Sự cố nghiêm trọng. Vui lòng tránh khu vực.',
                'affected_edges' => $edges->pluck('edge_id')->values(),
            ],
            'status' => 'pending',
        ]);
    }

    private function generateHigh(Prediction $prediction, $edges): void
    {
        // Reroute + alert
        $affectedEdgeIds = $edges->pluck('edge_id')->values();
        $avgDelay = $edges->avg('predicted_delay_s');

        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'reroute',
            'description' => "Đề xuất chuyển hướng — dự đoán tắc nghẽn lan rộng {$affectedEdgeIds->count()} đoạn.",
            'details' => [
                'affected_edges' => $affectedEdgeIds,
                'estimated_delay_s' => (int) $avgDelay,
            ],
            'status' => 'pending',
        ]);

        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'alert',
            'description' => 'Cảnh báo ùn tắc — khuyến cáo chọn đường khác.',
            'details' => [
                'message' => '⚠️ Ùn tắc nghiêm trọng phía trước. Nên chuyển hướng.',
                'affected_edges' => $affectedEdgeIds,
            ],
            'status' => 'pending',
        ]);
    }

    private function generateMedium(Prediction $prediction, $edges): void
    {
        // Reroute suggestion only
        Recommendation::create([
            'prediction_id' => $prediction->id,
            'incident_id' => $prediction->incident_id,
            'type' => 'reroute',
            'description' => 'Gợi ý chuyển hướng — dự đoán có thể tắc trong 15–60 phút tới.',
            'details' => [
                'affected_edges' => $edges->pluck('edge_id')->values(),
                'estimated_delay_s' => (int) $edges->avg('predicted_delay_s'),
                'suggestion_only' => true,
            ],
            'status' => 'pending',
        ]);
    }
}

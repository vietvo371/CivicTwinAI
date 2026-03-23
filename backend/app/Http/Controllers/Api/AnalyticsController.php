<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Helpers\ApiResponse;
use App\Models\Edge;
use App\Models\Incident;
use App\Models\Prediction;
use App\Models\PredictionEdge;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function overview()
    {
        // KPIs
        $totalIncidents = Incident::count();
        $openIncidents = Incident::whereIn('status', ['open', 'investigating'])->count();
        $resolvedIncidents = Incident::where('status', 'resolved')->count();
        $totalPredictions = Prediction::count();
        $completedPredictions = Prediction::where('status', 'completed')->count();
        $avgProcessingTime = Prediction::where('status', 'completed')->avg('processing_time_ms') ?? 0;
        $totalEdges = Edge::count();
        $congestedEdges = Edge::where('current_density', '>', 0.6)->count();
        $avgDensity = Edge::avg('current_density') ?? 0;

        // Severity distribution
        $severityDist = Incident::selectRaw("severity, count(*) as count")
            ->groupBy('severity')
            ->pluck('count', 'severity');

        // Type distribution
        $typeDist = Incident::selectRaw("type, count(*) as count")
            ->groupBy('type')
            ->pluck('count', 'type');

        // Congestion level distribution
        $congestionDist = Edge::selectRaw("congestion_level, count(*) as count")
            ->groupBy('congestion_level')
            ->pluck('count', 'congestion_level');

        // Edge density distribution (histogram buckets)
        $densityBuckets = [];
        $ranges = [
            ['min' => 0, 'max' => 0.2, 'label' => '0-20%'],
            ['min' => 0.2, 'max' => 0.4, 'label' => '20-40%'],
            ['min' => 0.4, 'max' => 0.6, 'label' => '40-60%'],
            ['min' => 0.6, 'max' => 0.8, 'label' => '60-80%'],
            ['min' => 0.8, 'max' => 1.01, 'label' => '80-100%'],
        ];
        foreach ($ranges as $r) {
            $densityBuckets[] = [
                'range' => $r['label'],
                'count' => Edge::whereBetween('current_density', [$r['min'], $r['max']])->count(),
            ];
        }

        // Top congested roads
        $topCongested = Edge::select('id', 'name', 'current_density', 'current_speed_kmh', 'congestion_level')
            ->orderByDesc('current_density')
            ->take(10)
            ->get();

        // Incidents over time (group by date)
        $incidentTimeline = Incident::selectRaw("DATE(created_at) as date, count(*) as count")
            ->groupBy('date')
            ->orderBy('date')
            ->take(30)
            ->get();

        // Prediction confidence distribution
        $avgConfidence = PredictionEdge::avg('confidence') ?? 0;
        $avgPredDensity = PredictionEdge::avg('predicted_density') ?? 0;

        return ApiResponse::success([
            'kpis' => [
                'total_incidents' => $totalIncidents,
                'open_incidents' => $openIncidents,
                'resolved_incidents' => $resolvedIncidents,
                'resolution_rate' => $totalIncidents > 0 ? round(($resolvedIncidents / $totalIncidents) * 100) : 0,
                'total_predictions' => $totalPredictions,
                'completed_predictions' => $completedPredictions,
                'avg_processing_time_ms' => round($avgProcessingTime),
                'total_edges' => $totalEdges,
                'congested_edges' => $congestedEdges,
                'avg_density' => round($avgDensity, 4),
                'avg_confidence' => round($avgConfidence, 4),
                'avg_predicted_density' => round($avgPredDensity, 4),
            ],
            'severity_distribution' => $severityDist,
            'type_distribution' => $typeDist,
            'congestion_distribution' => $congestionDist,
            'density_histogram' => $densityBuckets,
            'top_congested' => $topCongested,
            'incident_timeline' => $incidentTimeline,
        ]);
    }
}

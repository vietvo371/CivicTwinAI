<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Edge;
use App\Models\Incident;
use App\Services\PriorityRouteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PriorityRouteController extends Controller
{
    public function __construct(
        private readonly PriorityRouteService $routeService,
    ) {}

    /**
     * POST /api/emergency/priority-route
     *
     * Find the fastest emergency route from origin to destination,
     * automatically avoiding edges with active incidents.
     *
     * Body: origin_lat, origin_lng, destination_lat, destination_lng,
     *       vehicle_type, incident_id (optional)
     */
    public function calculate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'origin_lat' => 'required|numeric|between:-90,90',
            'origin_lng' => 'required|numeric|between:-180,180',
            'destination_lat' => 'required|numeric|between:-90,90',
            'destination_lng' => 'required|numeric|between:-180,180',
            'vehicle_type' => 'nullable|in:ambulance,fire_truck,police,rescue',
            'incident_id' => 'nullable|exists:incidents,id',
        ]);

        $origin = [
            'lat' => (float) $validated['origin_lat'],
            'lng' => (float) $validated['origin_lng'],
        ];
        $destination = [
            'lat' => (float) $validated['destination_lat'],
            'lng' => (float) $validated['destination_lng'],
        ];

        // Build avoid list: incident edges + severely congested edges
        $avoidEdgeIds = [];

        if (! empty($validated['incident_id'])) {
            $incident = Incident::find($validated['incident_id']);
            $raw = $incident?->affected_edge_ids;
            if ($raw !== null) {
                if (is_string($raw)) {
                    $parts = explode(',', trim($raw, '{}'));
                    $avoidEdgeIds = array_filter(array_map('intval', $parts));
                } elseif (is_array($raw)) {
                    $avoidEdgeIds = array_values(array_filter($raw, 'is_int'));
                }
            }
        }

        // Avoid severely congested edges (density > 0.8)
        $congestedIds = Edge::where('current_density', '>', 0.8)
            ->where('status', '!=', 'closed')
            ->pluck('id')
            ->toArray();
        $avoidEdgeIds = array_values(array_unique(array_merge($avoidEdgeIds, $congestedIds)));

        Log::info('priority_route.request', [
            'origin' => $origin,
            'destination' => $destination,
            'vehicle' => $validated['vehicle_type'] ?? 'unknown',
            'avoid_edges' => count($avoidEdgeIds),
        ]);

        $route = $this->routeService->findPriorityRoute($origin, $destination, $avoidEdgeIds);

        if ($route['is_blocked'] && empty($route['route'])) {
            return ApiResponse::error('api.route_not_found', 422, [
                'suggestion' => 'Try a different destination or wait for traffic to clear.',
            ]);
        }

        return ApiResponse::success($route, 'api.priority_route_calculated');
    }

    /**
     * GET /api/emergency/priority-route/preview
     *
     * Lightweight preview — returns total distance + ETA only.
     * Used for showing quick ETA before user commits.
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'origin_lat' => 'required|numeric|between:-90,90',
            'origin_lng' => 'required|numeric|between:-180,180',
            'destination_lat' => 'required|numeric|between:-90,90',
            'destination_lng' => 'required|numeric|between:-180,180',
        ]);

        $route = $this->routeService->findPriorityRoute(
            ['lat' => (float) $validated['origin_lat'], 'lng' => (float) $validated['origin_lng']],
            ['lat' => (float) $validated['destination_lat'], 'lng' => (float) $validated['destination_lng']],
        );

        return ApiResponse::success([
            'total_distance_km' => $route['total_distance_km'] ?? 0,
            'estimated_time_min' => $route['estimated_time_min'] ?? 0,
            'is_blocked' => $route['is_blocked'] ?? false,
            'congestion_avoided' => $route['congestion_avoided'] ?? false,
        ], 'api.route_preview');
    }
}

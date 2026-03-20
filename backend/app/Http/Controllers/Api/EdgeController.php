<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Edge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Helpers\ApiResponse;

class EdgeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Edge::with(['sourceNode', 'targetNode']);

        if ($request->has('congestion_level')) {
            $query->where('congestion_level', $request->congestion_level);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $edges = $query->get()->map(fn ($edge) => [
            'id' => $edge->id,
            'name' => $edge->name,
            'source_node' => $edge->sourceNode->name,
            'target_node' => $edge->targetNode->name,
            'length_m' => $edge->length_m,
            'lanes' => $edge->lanes,
            'speed_limit_kmh' => $edge->speed_limit_kmh,
            'current_density' => $edge->current_density,
            'current_speed_kmh' => $edge->current_speed_kmh,
            'congestion_level' => $edge->congestion_level,
            'status' => $edge->status,
            'metrics_updated_at' => $edge->metrics_updated_at,
        ]);
        return ApiResponse::success($edges, 'Traffic edges retrieved');
    }

    public function geojson(Request $request): JsonResponse
    {
        $query = Edge::query();

        if ($request->has('congestion_level')) {
            $query->where('congestion_level', $request->congestion_level);
        }

        $edges = $query->get();

        $features = $edges->map(function ($edge) {
            $geom = DB::selectOne(
                'SELECT ST_AsGeoJSON(geometry) as geojson FROM edges WHERE id = ?',
                [$edge->id]
            );

            return [
                'type' => 'Feature',
                'id' => $edge->id,
                'geometry' => json_decode($geom->geojson),
                'properties' => [
                    'id' => $edge->id,
                    'name' => $edge->name,
                    'lanes' => $edge->lanes,
                    'speed_limit_kmh' => $edge->speed_limit_kmh,
                    'current_density' => (float) $edge->current_density,
                    'current_speed_kmh' => (float) $edge->current_speed_kmh,
                    'congestion_level' => $edge->congestion_level,
                    'status' => $edge->status,
                    'direction' => $edge->direction,
                    'road_type' => $edge->road_type,
                ],
            ];
        });

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features->values(),
        ]);
    }

    public function show(Edge $edge): JsonResponse
    {
        $edge->load(['sourceNode', 'targetNode', 'sensors']);

        $geom = DB::selectOne(
            'SELECT ST_AsGeoJSON(geometry) as geojson FROM edges WHERE id = ?',
            [$edge->id]
        );

        return ApiResponse::success([
            'id' => $edge->id,
            'name' => $edge->name,
            'source_node' => $edge->sourceNode,
            'target_node' => $edge->targetNode,
            'geometry' => json_decode($geom->geojson),
            'length_m' => $edge->length_m,
            'lanes' => $edge->lanes,
            'speed_limit_kmh' => $edge->speed_limit_kmh,
            'direction' => $edge->direction,
            'road_type' => $edge->road_type,
            'current_density' => $edge->current_density,
            'current_speed_kmh' => $edge->current_speed_kmh,
            'current_flow' => $edge->current_flow,
            'congestion_level' => $edge->congestion_level,
            'status' => $edge->status,
            'metrics_updated_at' => $edge->metrics_updated_at,
            'sensors_count' => $edge->sensors->count(),
        ], 'Edge details retrieved');
    }
}

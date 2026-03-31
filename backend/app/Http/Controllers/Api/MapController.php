<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Helpers\ApiResponse;

class MapController extends Controller
{
    /**
     * Get incidents as GeoJSON FeatureCollection for Mobile Map
     */
    public function reports(Request $request)
    {
        // Category mapping from Mobile:
        // 1: Giao thông (Traffic)
        // 2: Môi trường (Environment)
        // 3: Hỏa hoạn (Fire)
        // 4: Rác thải (Trash - maybe other/environment)
        // 5: Ngập lụt (Flood - weather)
        // 6: Khác (Other)
        
        $typeToCategory = [
            'accident' => 1,
            'congestion' => 1,
            'weather' => 5,
            'other' => 6,
            'construction' => 1,
        ];

        $statusToNum = [
            'open' => 0,
            'investigating' => 2,
            'resolved' => 3,
            'closed' => 4,
        ];

        $severityToNum = [
            'low' => 1,
            'medium' => 2,
            'high' => 3,
            'critical' => 4,
        ];

        $query = Incident::select([
                'id', 'title', 'type', 'severity', 'status', 'created_at', 'reported_by',
                DB::raw('ST_X(location::geometry) as longitude'),
                DB::raw('ST_Y(location::geometry) as latitude'),
            ])
            ->whereNotNull('location');

        if ($request->has('min_lon') && $request->has('max_lon') && $request->has('min_lat') && $request->has('max_lat')) {
            // Apply bounding box filtering if coordinates provided
            $minLon = (float) $request->min_lon;
            $maxLon = (float) $request->max_lon;
            $minLat = (float) $request->min_lat;
            $maxLat = (float) $request->max_lat;

            if (DB::connection()->getDriverName() === 'pgsql') {
                $query->whereRaw('location::geometry @ ST_MakeEnvelope(?, ?, ?, ?, 4326)', [$minLon, $minLat, $maxLon, $maxLat]);
            }
        }

        $incidents = $query->get();

        $features = $incidents->map(function ($incident) use ($typeToCategory, $statusToNum, $severityToNum) {
            $catId = $typeToCategory[$incident->type] ?? 6;
            
            return [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [
                        (float) $incident->longitude,
                        (float) $incident->latitude
                    ]
                ],
                'properties' => [
                    'id' => $incident->id,
                    'tieu_de' => $incident->title,
                    'danh_muc' => $catId,
                    'danh_muc_text' => __('incident_type.' . $incident->type),
                    'trang_thai' => $statusToNum[$incident->status] ?? 0,
                    'uu_tien' => $severityToNum[$incident->severity] ?? 1,
                    'kinh_do' => (float) $incident->longitude,
                    'vi_do' => (float) $incident->latitude,
                    'nguoi_dung' => $incident->reported_by
                ]
            ];
        });

        $geojson = [
            'type' => 'FeatureCollection',
            'features' => $features,
        ];

        return ApiResponse::success($geojson, 'api.map_reports_retrieved');
    }

    public function heatmap(Request $request)
    {
        // Simple implementation returning points for heatmap
        $query = Incident::select([
            DB::raw('ST_X(location::geometry) as longitude'),
            DB::raw('ST_Y(location::geometry) as latitude'),
            'severity'
        ])
        ->whereNotNull('location')
        ->where('status', '!=', 'resolved');

        $points = $query->get()->map(function ($incident) {
            $weight = match($incident->severity) {
                'critical' => 1.0,
                'high' => 0.8,
                'medium' => 0.5,
                default => 0.2,
            };
            
            return [
                'latitude' => (float) $incident->latitude,
                'longitude' => (float) $incident->longitude,
                'weight' => $weight
            ];
        });

        return ApiResponse::success($points, 'api.map_heatmap_retrieved');
    }

    public function clusters(Request $request)
    {
        // Mobile uses mapbox-gl shape source clustering natively. 
        // This endpoint could return basic data or be unused. Returning empty array for now.
        return ApiResponse::success([], 'api.map_clusters_retrieved');
    }
    
    public function routes(Request $request)
    {
        // Map features routes if necessary.
        return ApiResponse::success([], 'api.map_routes_retrieved');
    }
}

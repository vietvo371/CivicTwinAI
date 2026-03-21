<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Incident;
use App\Models\Prediction;
use App\Models\Recommendation;
use App\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class SystemController extends Controller
{
    public function stats(): JsonResponse
    {
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('is_active', true)->count(),
            'total_nodes' => DB::table('nodes')->count(),
            'total_edges' => DB::table('edges')->count(),
            'total_sensors' => DB::table('sensors')->count(),
            'total_incidents' => Incident::count(),
            'active_incidents' => Incident::whereIn('status', ['open', 'investigating'])->count(),
            'critical_incidents' => Incident::where('severity', 'critical')->whereIn('status', ['open', 'investigating'])->count(),
            'total_predictions' => Prediction::count(),
            'completed_predictions' => Prediction::where('status', 'completed')->count(),
            'failed_predictions' => Prediction::where('status', 'failed')->count(),
            'total_recommendations' => Recommendation::count(),
            'pending_recommendations' => Recommendation::where('status', 'pending')->count(),
            'approved_recommendations' => Recommendation::where('status', 'approved')->count(),
            'rejected_recommendations' => Recommendation::where('status', 'rejected')->count(),
            'users_by_role' => DB::table('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->select('roles.name', DB::raw('count(*) as count'))
                ->groupBy('roles.name')
                ->pluck('count', 'name'),
            'incidents_by_type' => Incident::select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->pluck('count', 'type'),
            'incidents_by_severity' => Incident::select('severity', DB::raw('count(*) as count'))
                ->groupBy('severity')
                ->pluck('count', 'severity'),
        ];

        return ApiResponse::success($stats, 'api.stats_retrieved');
    }

    public function logs(Request $request): JsonResponse
    {
        $query = Activity::with('causer')
            ->latest();

        if ($request->has('log_name')) {
            $query->where('log_name', $request->log_name);
        }

        if ($request->has('causer_id')) {
            $query->where('causer_id', $request->causer_id);
        }

        $logs = $query->paginate($request->get('per_page', 20));

        return ApiResponse::paginate($logs, 'api.logs_retrieved');
    }
}

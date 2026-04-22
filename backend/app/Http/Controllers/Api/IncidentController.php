<?php

namespace App\Http\Controllers\Api;

use App\Events\IncidentCreated;
use App\Events\IncidentResolved;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Jobs\CallAIPrediction;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IncidentController extends Controller
{
    private const MAX_INCIDENT_IMAGES = 5;

    /**
     * Thu thập ảnh từ multipart: field `image` (1 file) và/hoặc `images[]` (tối đa 5).
     * Web và mobile dùng chung POST /incidents, không tách endpoint hay field riêng.
     *
     * @return list<string> URL công khai lưu vào metadata.images
     */
    private function collectIncidentImageUrls(Request $request): array
    {
        $urls = [];
        $max = self::MAX_INCIDENT_IMAGES;

        $files = [];
        if ($request->hasFile('image')) {
            $files[] = $request->file('image');
        }
        $batch = $request->file('images');
        if ($batch !== null) {
            $batch = is_array($batch) ? $batch : [$batch];
            foreach ($batch as $f) {
                if ($f && $f->isValid()) {
                    $files[] = $f;
                }
            }
        }

        foreach (array_slice($files, 0, $max) as $file) {
            $path = $file->store('incidents', 'public');
            $urls[] = url('storage/'.$path);
        }

        return array_values(array_unique($urls));
    }

    public function publicList(Request $request): JsonResponse
    {
        $query = Incident::select([
            'id', 'title', 'type', 'severity', 'status', 'description', 'affected_edge_ids', 'created_at',
            DB::raw('ST_X(location::geometry) as longitude'),
            DB::raw('ST_Y(location::geometry) as latitude'),
        ])
            ->whereNotNull('location')
            ->where('status', '!=', 'resolved')
            ->latest();

        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        $incidents = $query->paginate($request->get('per_page', 50));

        return ApiResponse::paginate($incidents, 'api.incidents_retrieved');
    }

    public function index(Request $request): JsonResponse
    {
        $query = Incident::with(['reporter', 'assignee'])
            ->latest();

        // Citizens only see incidents they reported
        $user = $request->user();
        if ($user && $user->roles && in_array('citizen', $user->roles->pluck('name')->toArray())) {
            $query->where('reported_by', $user->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        $incidents = $query->paginate($request->get('per_page', 15));

        return ApiResponse::paginate($incidents, 'api.incidents_retrieved');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|min:10',
            'type' => 'required|in:accident,congestion,construction,weather,other',
            'severity' => 'required|in:low,medium,high,critical',
            'source' => 'required|in:operator,citizen,auto_detected',
            'location_name' => 'required|string|min:5',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'affected_edge_ids' => 'nullable|array',
            'affected_edge_ids.*' => 'integer|exists:edges,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'images' => 'nullable|array|max:'.self::MAX_INCIDENT_IMAGES,
            'images.*' => 'image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $imageUrls = $this->collectIncidentImageUrls($request);
        $metadata = [];
        if ($imageUrls !== []) {
            $metadata['images'] = $imageUrls;
        }

        $incident = Incident::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'severity' => $validated['severity'],
            'source' => $validated['source'],
            'reported_by' => $request->user()->id,
            'metadata' => $metadata,
        ]);

        $isPostgres = DB::connection()->getDriverName() === 'pgsql';

        // Set PostGIS location if provided
        if ($isPostgres && isset($validated['latitude'], $validated['longitude'])) {
            DB::statement(
                'UPDATE incidents SET location = ST_SetSRID(ST_Point(?, ?), 4326) WHERE id = ?',
                [$validated['longitude'], $validated['latitude'], $incident->id]
            );
        }

        // Set affected edges
        if ($isPostgres && ! empty($validated['affected_edge_ids'])) {
            $edgeArray = '{'.implode(',', $validated['affected_edge_ids']).'}';
            DB::statement(
                'UPDATE incidents SET affected_edge_ids = ? WHERE id = ?',
                [$edgeArray, $incident->id]
            );
        }

        // Broadcast realtime event to all connected clients
        IncidentCreated::dispatch($incident);

        // Dispatch AI prediction job for all severities (with locale for localized recommendations)
        $locale = $request->header('Accept-Language') ?? $request->header('x-Language') ?? 'vi';
        CallAIPrediction::dispatch($incident, str_starts_with(strtolower($locale), 'en') ? 'en' : 'vi');

        return ApiResponse::created($incident->fresh(['reporter']), 'api.incident_created');
    }

    public function publicShow(Incident $incident): JsonResponse
    {
        $incident->load(['predictions.predictionEdges', 'recommendations' => function ($q) {
            $q->whereIn('status', ['approved', 'executed'])->latest()->limit(3);
        }]);

        $coords = null;
        if (DB::connection()->getDriverName() === 'pgsql') {
            $coords = DB::selectOne(
                'SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM incidents WHERE id = ? AND location IS NOT NULL',
                [$incident->id]
            );
        }

        $latestPrediction = $incident->predictions->sortByDesc('created_at')->first();

        return ApiResponse::success([
            'id' => $incident->id,
            'title' => $incident->title,
            'description' => $incident->description,
            'type' => $incident->type,
            'severity' => $incident->severity,
            'status' => $incident->status,
            'source' => $incident->source,
            'location_name' => $incident->location_name,
            'affected_edge_ids' => $incident->affected_edge_ids ?? [],
            'images' => $incident->metadata['images'] ?? [],
            'created_at' => $incident->created_at->toISOString(),
            'location' => $coords,
            'prediction' => $latestPrediction ? [
                'model_version' => $latestPrediction->model_version,
                'status' => $latestPrediction->status,
                'processing_time_ms' => $latestPrediction->processing_time_ms,
                'edges_count' => $latestPrediction->predictionEdges->count(),
                'max_density' => $latestPrediction->predictionEdges->max(fn ($e) => (float) $e->predicted_density),
                'avg_confidence' => $latestPrediction->predictionEdges->avg(fn ($e) => (float) $e->confidence),
            ] : null,
            'recommendations' => $incident->recommendations->map(fn ($r) => [
                'type' => $r->type,
                'description' => $r->description,
                'status' => $r->status,
            ])->values(),
        ], 'api.incident_details');
    }

    public function show(Incident $incident): JsonResponse
    {
        $incident->load(['reporter', 'assignee', 'predictions.predictionEdges.edge', 'recommendations']);

        $coords = null;
        if (DB::connection()->getDriverName() === 'pgsql') {
            $coords = DB::selectOne(
                'SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM incidents WHERE id = ? AND location IS NOT NULL',
                [$incident->id]
            );
        }

        // Build prediction summary (same as publicShow)
        $latestPrediction = $incident->predictions->sortByDesc('created_at')->first();

        return ApiResponse::success(array_merge($incident->toArray(), [
            'location' => $coords,
            'images' => $incident->metadata['images'] ?? [],
            'prediction' => $latestPrediction ? [
                'model_version' => $latestPrediction->model_version,
                'status' => $latestPrediction->status,
                'processing_time_ms' => $latestPrediction->processing_time_ms,
                'edges_count' => $latestPrediction->predictionEdges->count(),
                'max_density' => $latestPrediction->predictionEdges->max(fn ($e) => (float) $e->predicted_density),
                'avg_confidence' => $latestPrediction->predictionEdges->avg(fn ($e) => (float) $e->confidence),
            ] : null,
        ]), 'api.incident_details');
    }

    public function update(Request $request, Incident $incident): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:open,investigating,resolved,closed',
            'severity' => 'sometimes|in:low,medium,high,critical',
            'assigned_to' => 'sometimes|nullable|exists:users,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
        ]);

        $isResolving = isset($validated['status'])
            && in_array($validated['status'], ['resolved', 'closed'])
            && ! in_array($incident->status, ['resolved', 'closed']);

        if ($isResolving) {
            $validated['resolved_at'] = now();
        }

        $incident->update($validated);

        // When resolved/closed: restore affected edges to baseline density
        if ($isResolving) {
            $affectedIds = $incident->affected_edge_ids ?? [];

            // Also collect edge IDs from the latest prediction for this incident
            $predEdgeIds = DB::table('prediction_edges as pe')
                ->join('predictions as p', 'p.id', '=', 'pe.prediction_id')
                ->where('p.incident_id', $incident->id)
                ->where('p.status', 'completed')
                ->pluck('pe.edge_id')
                ->toArray();

            $allEdgeIds = array_unique(array_merge($affectedIds, $predEdgeIds));

            if (! empty($allEdgeIds)) {
                DB::table('edges')
                    ->whereIn('id', $allEdgeIds)
                    ->update([
                        'current_density'    => DB::raw('LEAST(current_density * 0.4, 0.3)'),
                        'current_speed_kmh'  => DB::raw('ROUND((speed_limit_kmh * (1.0 - LEAST(current_density * 0.4, 0.3)) * 0.9)::numeric, 1)'),
                        'congestion_level'   => 'none',
                        'metrics_updated_at' => now(),
                    ]);
            }

            IncidentResolved::dispatch($incident->fresh(), $allEdgeIds);
        }

        return ApiResponse::success($incident->fresh(['reporter', 'assignee']), 'api.incident_updated');
    }
}

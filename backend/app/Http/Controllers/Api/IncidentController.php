<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Jobs\CallAIPrediction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncidentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Incident::with(['reporter', 'assignee'])
            ->latest();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        $incidents = $query->paginate($request->get('per_page', 15));

        return response()->json($incidents);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:accident,congestion,construction,weather,other',
            'severity' => 'required|in:low,medium,high,critical',
            'source' => 'required|in:operator,citizen,auto_detected',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'affected_edge_ids' => 'nullable|array',
            'affected_edge_ids.*' => 'integer|exists:edges,id',
        ]);

        $incident = Incident::create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'severity' => $validated['severity'],
            'source' => $validated['source'],
            'reported_by' => $request->user()->id,
            'metadata' => [],
        ]);

        // Set PostGIS location if provided
        if (isset($validated['latitude'], $validated['longitude'])) {
            \DB::statement(
                'UPDATE incidents SET location = ST_SetSRID(ST_Point(?, ?), 4326) WHERE id = ?',
                [$validated['longitude'], $validated['latitude'], $incident->id]
            );
        }

        // Set affected edges
        if (! empty($validated['affected_edge_ids'])) {
            $edgeArray = '{' . implode(',', $validated['affected_edge_ids']) . '}';
            \DB::statement(
                'UPDATE incidents SET affected_edge_ids = ? WHERE id = ?',
                [$edgeArray, $incident->id]
            );
        }

        // Dispatch AI prediction job for medium+ severity
        if (in_array($validated['severity'], ['medium', 'high', 'critical'])) {
            CallAIPrediction::dispatch($incident);
        }

        return response()->json([
            'message' => 'Sự cố đã được tạo.',
            'data' => $incident->fresh(['reporter']),
        ], 201);
    }

    public function show(Incident $incident): JsonResponse
    {
        $incident->load(['reporter', 'assignee', 'predictions.predictionEdges', 'recommendations']);

        $coords = \DB::selectOne(
            'SELECT ST_X(location) as lng, ST_Y(location) as lat FROM incidents WHERE id = ? AND location IS NOT NULL',
            [$incident->id]
        );

        return response()->json([
            'data' => array_merge($incident->toArray(), [
                'location' => $coords,
            ]),
        ]);
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

        if (isset($validated['status']) && $validated['status'] === 'resolved') {
            $validated['resolved_at'] = now();
        }

        $incident->update($validated);

        return response()->json([
            'message' => 'Sự cố đã được cập nhật.',
            'data' => $incident->fresh(['reporter', 'assignee']),
        ]);
    }
}

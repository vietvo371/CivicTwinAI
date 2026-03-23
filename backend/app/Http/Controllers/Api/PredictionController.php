<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
use App\Models\Incident;
use App\Jobs\CallAIPrediction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;

class PredictionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Prediction::with('predictionEdges.edge');

        if ($request->has('incident_id')) {
            $query->where('incident_id', $request->incident_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $predictions = $query->latest()->paginate($request->get('per_page', 15));

        return ApiResponse::paginate($predictions, 'api.predictions_retrieved');
    }

    public function show(Prediction $prediction): JsonResponse
    {
        $prediction->load(['incident', 'predictionEdges.edge', 'recommendations']);

        return ApiResponse::success($prediction, 'api.prediction_details');
    }

    public function trigger(Request $request): JsonResponse
    {
        $incidentId = $request->input('incident_id');

        $incident = $incidentId
            ? Incident::findOrFail($incidentId)
            : Incident::latest()->first();

        if (!$incident) {
            return ApiResponse::error('No incidents found to run prediction on.', 404);
        }

        // Run synchronously so we can return results immediately
        CallAIPrediction::dispatchSync($incident);

        // Load the latest prediction for this incident
        $prediction = Prediction::where('incident_id', $incident->id)
            ->latest()
            ->with('predictionEdges.edge')
            ->first();

        return ApiResponse::success([
            'message' => 'Prediction completed',
            'incident_id' => $incident->id,
            'prediction' => $prediction,
        ], 'api.prediction_triggered');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prediction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;

class PredictionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Prediction::with('predictionEdges');

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
}

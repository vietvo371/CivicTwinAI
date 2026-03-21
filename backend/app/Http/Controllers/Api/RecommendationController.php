<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recommendation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;

class RecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Recommendation::with(['incident', 'prediction']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('incident_id')) {
            $query->where('incident_id', $request->incident_id);
        }

        $recommendations = $query->latest()->paginate($request->get('per_page', 15));

        return ApiResponse::paginate($recommendations, 'api.recommendations_retrieved');
    }

    public function show(Recommendation $recommendation): JsonResponse
    {
        $recommendation->load(['incident', 'prediction.predictionEdges', 'approver']);

        return ApiResponse::success($recommendation, 'api.recommendation_details');
    }

    public function approve(Request $request, Recommendation $recommendation): JsonResponse
    {
        if ($recommendation->status !== 'pending') {
            return ApiResponse::validationError(null, 'api.only_pending');
        }

        $recommendation->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return ApiResponse::success($recommendation->fresh(['approver']), 'api.recommendation_approved');
    }

    public function reject(Request $request, Recommendation $recommendation): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if ($recommendation->status !== 'pending') {
            return ApiResponse::validationError(null, 'api.only_pending');
        }

        $recommendation->update([
            'status' => 'rejected',
            'rejected_reason' => $request->reason,
        ]);

        return ApiResponse::success($recommendation, 'api.recommendation_rejected');
    }
}

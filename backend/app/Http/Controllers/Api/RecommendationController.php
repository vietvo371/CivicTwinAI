<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recommendation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        return response()->json($recommendations);
    }

    public function show(Recommendation $recommendation): JsonResponse
    {
        $recommendation->load(['incident', 'prediction.predictionEdges', 'approver']);

        return response()->json(['data' => $recommendation]);
    }

    public function approve(Request $request, Recommendation $recommendation): JsonResponse
    {
        if ($recommendation->status !== 'pending') {
            return response()->json([
                'message' => 'Chỉ có thể duyệt đề xuất đang ở trạng thái pending.',
            ], 422);
        }

        $recommendation->update([
            'status' => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Đề xuất đã được phê duyệt.',
            'data' => $recommendation->fresh(['approver']),
        ]);
    }

    public function reject(Request $request, Recommendation $recommendation): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        if ($recommendation->status !== 'pending') {
            return response()->json([
                'message' => 'Chỉ có thể từ chối đề xuất đang ở trạng thái pending.',
            ], 422);
        }

        $recommendation->update([
            'status' => 'rejected',
            'rejected_reason' => $request->reason,
        ]);

        return response()->json([
            'message' => 'Đề xuất đã bị từ chối.',
            'data' => $recommendation,
        ]);
    }
}

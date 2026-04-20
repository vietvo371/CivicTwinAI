<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Recommendation;
use App\Models\User;
use App\Notifications\RecommendationAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        $this->dispatchRecommendationNotifications($recommendation, $request->user(), 'approve');

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

        $rejectedReason = $request->input('reason');
        $recommendation->update([
            'status' => 'rejected',
            'rejected_reason' => $rejectedReason,
        ]);

        $this->notifyReporterOfOutcome($recommendation, 'recommendation_rejected');

        return ApiResponse::success($recommendation, 'api.recommendation_rejected');
    }

    /**
     * Gửi notification khi recommendation được duyệt:
     * - Emergency users (emergency role) → cảnh báo route ưu tiên
     * - Reporter của incident gốc → thông báo phương án đã duyệt
     */
    private function dispatchRecommendationNotifications(
        Recommendation $recommendation,
        User $operator,
        string $action
    ): void {
        $incident = $recommendation->incident;
        $operatorName = $operator->name ?? 'Operator';

        // 1) Notify all emergency users via role lookup
        $emergencyUsers = User::role('emergency')
            ->whereNotNull('fcm_token')
            ->where('is_active', true)
            ->get();

        foreach ($emergencyUsers as $emergencyUser) {
            try {
                $isPriorityRoute = $recommendation->type === 'alternative_route'
                    || $recommendation->type === 'evacuation'
                    || $recommendation->type === 'lane_closure';

                $eventType = $isPriorityRoute ? 'critical_route_approved' : 'recommendation_approved';

                $emergencyUser->notify(new RecommendationAlert(
                    $recommendation,
                    $eventType,
                    $operatorName
                ));
            } catch (\Throwable $e) {
                Log::warning('fcm.recommendation_emergency_notify_failed', [
                    'user_id' => $emergencyUser->id,
                    'recommendation_id' => $recommendation->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // 2) Notify the original incident reporter
        if ($incident && $incident->reported_by) {
            $reporter = User::find($incident->reported_by);
            if ($reporter && $reporter->fcm_token) {
                try {
                    $reporter->notify(new RecommendationAlert(
                        $recommendation,
                        'recommendation_approved',
                        $operatorName
                    ));
                } catch (\Throwable $e) {
                    Log::warning('fcm.recommendation_reporter_notify_failed', [
                        'user_id' => $reporter->id,
                        'recommendation_id' => $recommendation->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }

    /**
     * Gửi notification cho reporter khi recommendation bị từ chối.
     */
    private function notifyReporterOfOutcome(Recommendation $recommendation, string $eventType): void
    {
        $incident = $recommendation->incident;
        if (! $incident || ! $incident->reported_by) {
            return;
        }

        $reporter = User::find($incident->reported_by);
        if ($reporter && $reporter->fcm_token) {
            try {
                $reporter->notify(new RecommendationAlert($recommendation, $eventType));
            } catch (\Throwable $e) {
                Log::warning('fcm.recommendation_reject_notify_failed', [
                    'user_id' => $reporter->id,
                    'recommendation_id' => $recommendation->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}

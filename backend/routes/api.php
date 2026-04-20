<?php

use App\Helpers\ApiResponse;
use App\Http\Controllers\Api\Admin\SystemController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AIAssistController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EdgeController;
use App\Http\Controllers\Api\GeocodeController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\MapController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\NodeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\PriorityRouteController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SensorDataController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\TrafficSimulationController;
use App\Models\Sensor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CivicTwin AI — API Routes (Multi-Actor Structure)
|--------------------------------------------------------------------------
*/

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    
    // OTP Password Reset
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('accept-otp-password', [AuthController::class, 'acceptOtpPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    // Socialite Login
    Route::get('google/redirect', [SocialAuthController::class, 'redirectToGoogle']);
    Route::get('google/callback', [SocialAuthController::class, 'handleGoogleCallback']);
});

// APIs that don't need authentication (e.g. Map embedding for public)
Route::prefix('public')->group(function () {
    Route::get('edges/geojson', [EdgeController::class, 'geojson']);
    Route::get('incidents', [IncidentController::class, 'publicList']); // placeholder if public list needed
});

// ==========================================
// 2. AUTHENTICATED ROUTES (General valid token)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    // Profile Management
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::get('auth/check-login', [AuthController::class, 'me']); // Alias for mobile app
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/update-fcm-token', [AuthController::class, 'updateFcmToken']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);
    Route::post('auth/change-password', [AuthController::class, 'changePassword']);
    Route::put('profile', [AuthController::class, 'updateProfile']);

    // AI Assist (NLP + Vision)
    Route::post('ai/parse-report', [AIAssistController::class, 'parseReport']);
    Route::post('ai/analyze-image', [AIAssistController::class, 'analyzeImage']);

    /** Search địa điểm từ text (forward geocoding) — dùng cho Priority Route UI */
    Route::get('geocode/search', [GeocodeController::class, 'search']);
    /** Địa chỉ chữ từ tọa độ — gọi từ mobile thay vì Mapbox trực tiếp trên thiết bị */
    Route::get('geocode/reverse', [GeocodeController::class, 'reverse']);

    // Shared Map Data (Nodes, Edges)
    Route::get('nodes', [NodeController::class, 'index']);
    Route::get('nodes/{node}', [NodeController::class, 'show']);
    Route::get('edges', [EdgeController::class, 'index']);
    Route::get('edges/geojson', [EdgeController::class, 'geojson']);
    Route::get('edges/{edge}', [EdgeController::class, 'show']);
    // Sensors listing
    Route::get('sensors', function (Request $request) {
        $query = Sensor::with('edge');
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return ApiResponse::success($query->get(), 'api.sensors_retrieved');
    });

    // Mobile specific: Map Data endpoints
    Route::prefix('map')->group(function () {
        Route::get('reports', [MapController::class, 'reports']);
        Route::get('heatmap', [MapController::class, 'heatmap']);
        Route::get('clusters', [MapController::class, 'clusters']);
        Route::get('routes', [MapController::class, 'routes']);
    });

    // -------------------------------------------------------------------------
    // Mobile — Phản ánh (DTO tiếng Việt) → bảng `incidents`. App: reportService.
    // Web — Không dùng nhóm này; công dân web dùng POST/GET /incidents (JSON/EN).
    // -------------------------------------------------------------------------
    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index']);
        Route::post('/', [ReportController::class, 'store']);
        Route::get('my', [ReportController::class, 'my']);
        Route::get('nearby', [ReportController::class, 'nearby']);
        Route::get('trending', [ReportController::class, 'trending']);
        Route::get('stats', [ReportController::class, 'stats']);
        Route::get('{id}', [ReportController::class, 'show'])->whereNumber('id');
        Route::put('{id}', [ReportController::class, 'update'])->whereNumber('id');
        Route::delete('{id}', [ReportController::class, 'destroy'])->whereNumber('id');
        Route::post('{id}/view', [ReportController::class, 'view'])->whereNumber('id');
        Route::post('{id}/vote', [ReportController::class, 'vote'])->whereNumber('id');
        Route::post('{id}/rate', [ReportController::class, 'rate'])->whereNumber('id');
        Route::post('{id}/comments', [ReportController::class, 'comment'])->whereNumber('id');
    });

    // Mobile specific: Media endpoints
    Route::prefix('media')->group(function () {
        Route::post('upload', [MediaController::class, 'upload']);
        Route::get('my', [MediaController::class, 'my']);
        Route::get('{id}', [MediaController::class, 'show']);
        Route::delete('{id}', [MediaController::class, 'destroy']);
    });

    // Citizen-accessible: Create Incident + View (filtered by role in controller)
    Route::post('incidents', [IncidentController::class, 'store']);
    Route::get('incidents', [IncidentController::class, 'index']);
    Route::get('incidents/{incident}', [IncidentController::class, 'show']);

    // Notifications (all authenticated users)
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread', [NotificationController::class, 'unread']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // ==========================================
    // ==========================================
    // 3. OPERATOR ROUTES (traffic_operator | city_admin | super_admin)
    // ==========================================
    Route::middleware('role:traffic_operator|city_admin|super_admin|emergency|urban_planner')->group(function () {
        // Sensor Data Ingestion
        Route::post('sensor-data', [SensorDataController::class, 'ingest']);
        Route::post('sensor-data/batch', [SensorDataController::class, 'batchIngest']);

        // Traffic Management — Operator-only actions
        Route::patch('incidents/{incident}', [IncidentController::class, 'update']);

        // AI Predictions
        // AI Predictions & Simulations
        Route::get('predictions', [PredictionController::class, 'index']);
        Route::get('predictions/{prediction}', [PredictionController::class, 'show']);
        Route::post('predictions/trigger', [PredictionController::class, 'trigger']);
        Route::post('simulation/run', [TrafficSimulationController::class, 'runSimulation']);
        Route::get('analytics/overview', [AnalyticsController::class, 'overview']);

        // Decision Approvals (Recommendations)
        Route::get('recommendations', [RecommendationController::class, 'index']);
        Route::get('recommendations/{recommendation}', [RecommendationController::class, 'show']);
        Route::patch('recommendations/{recommendation}/approve', [RecommendationController::class, 'approve']);
        Route::patch('recommendations/{recommendation}/reject', [RecommendationController::class, 'reject']);

        // Emergency Priority Route (Dijkstra routing)
        Route::post('emergency/priority-route', [PriorityRouteController::class, 'calculate']);
        Route::get('emergency/priority-route/preview', [PriorityRouteController::class, 'preview']);
    });

    // ==========================================
    // 4. ADMIN ROUTES (city_admin | super_admin)
    // ==========================================
    Route::prefix('admin')->middleware('role:city_admin|super_admin')->group(function () {
        // User Management
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);

        // System Stats & Logs
        Route::get('stats', [SystemController::class, 'stats']);
        Route::get('logs', [SystemController::class, 'logs']);
    });
});

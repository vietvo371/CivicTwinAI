<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EdgeController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\MapController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\NodeController;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\SensorDataController;
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
    
    // Socialite Login 
    Route::get('google/redirect', [\App\Http\Controllers\Api\SocialAuthController::class, 'redirectToGoogle']);
    Route::get('google/callback', [\App\Http\Controllers\Api\SocialAuthController::class, 'handleGoogleCallback']);
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
    Route::post('ai/parse-report', [\App\Http\Controllers\Api\AIAssistController::class, 'parseReport']);
    Route::post('ai/analyze-image', [\App\Http\Controllers\Api\AIAssistController::class, 'analyzeImage']);

    // Shared Map Data (Nodes, Edges)
    Route::get('nodes', [NodeController::class, 'index']);
    Route::get('nodes/{node}', [NodeController::class, 'show']);
    Route::get('edges', [EdgeController::class, 'index']);
    Route::get('edges/geojson', [EdgeController::class, 'geojson']);
    Route::get('edges/{edge}', [EdgeController::class, 'show']);
    // Sensors listing
    Route::get('sensors', function (Request $request) {
        $query = \App\Models\Sensor::with('edge');
        if ($request->has('status')) $query->where('status', $request->status);
        return \App\Helpers\ApiResponse::success($query->get(), 'api.sensors_retrieved');
    });

    // Mobile specific: Map Data endpoints
    Route::prefix('map')->group(function () {
        Route::get('reports', [MapController::class, 'reports']);
        Route::get('heatmap', [MapController::class, 'heatmap']);
        Route::get('clusters', [MapController::class, 'clusters']);
        Route::get('routes', [MapController::class, 'routes']);
    });

    // Mobile specific: Reports endpoints (Citizen View)
    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index']);
        Route::post('/', [ReportController::class, 'store']);
        Route::get('my', [ReportController::class, 'my']);
        Route::get('nearby', [ReportController::class, 'nearby']); 
        Route::get('trending', [ReportController::class, 'trending']);
        Route::get('stats', [ReportController::class, 'stats']);
        Route::get('{id}', [ReportController::class, 'show']);
        Route::post('{id}/view', [ReportController::class, 'view']);
        // Route::put('{id}', [ReportController::class, 'update']);
        // Route::delete('{id}', [ReportController::class, 'destroy']);
        // Route::post('{id}/vote', [ReportController::class, 'vote']);
        // Route::post('{id}/rate', [ReportController::class, 'rate']);
        // Route::post('{id}/comments', [ReportController::class, 'comment']);
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
    Route::get('notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::get('notifications/unread', [\App\Http\Controllers\Api\NotificationController::class, 'unread']);
    Route::get('notifications/unread-count', [\App\Http\Controllers\Api\NotificationController::class, 'unreadCount']);
    Route::patch('notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllRead']);
    Route::patch('notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);

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
        Route::post('simulation/run', [\App\Http\Controllers\Api\TrafficSimulationController::class, 'runSimulation']);
        Route::get('analytics/overview', [\App\Http\Controllers\Api\AnalyticsController::class, 'overview']);

        // Decision Approvals (Recommendations)
        Route::get('recommendations', [RecommendationController::class, 'index']);
        Route::get('recommendations/{recommendation}', [RecommendationController::class, 'show']);
        Route::patch('recommendations/{recommendation}/approve', [RecommendationController::class, 'approve']);
        Route::patch('recommendations/{recommendation}/reject', [RecommendationController::class, 'reject']);
    });

    // ==========================================
    // 4. ADMIN ROUTES (city_admin | super_admin)
    // ==========================================
    Route::prefix('admin')->middleware('role:city_admin|super_admin')->group(function () {
        // User Management
        Route::get('users', [\App\Http\Controllers\Api\Admin\UserController::class, 'index']);
        Route::post('users', [\App\Http\Controllers\Api\Admin\UserController::class, 'store']);
        Route::put('users/{user}', [\App\Http\Controllers\Api\Admin\UserController::class, 'update']);
        Route::delete('users/{user}', [\App\Http\Controllers\Api\Admin\UserController::class, 'destroy']);

        // System Stats & Logs
        Route::get('stats', [\App\Http\Controllers\Api\Admin\SystemController::class, 'stats']);
        Route::get('logs', [\App\Http\Controllers\Api\Admin\SystemController::class, 'logs']);
    });
});

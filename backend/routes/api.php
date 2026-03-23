<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EdgeController;
use App\Http\Controllers\Api\IncidentController;
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
    Route::post('auth/logout', [AuthController::class, 'logout']);

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

    // ==========================================
    // ==========================================
    // 3. OPERATOR ROUTES (traffic_operator | city_admin | super_admin)
    // ==========================================
    Route::middleware('role:traffic_operator|city_admin|super_admin')->group(function () {
        // Sensor Data Ingestion
        Route::post('sensor-data', [SensorDataController::class, 'ingest']);
        Route::post('sensor-data/batch', [SensorDataController::class, 'batchIngest']);

        // Traffic Management & Incidents
        Route::get('incidents', [IncidentController::class, 'index']);
        Route::post('incidents', [IncidentController::class, 'store']);
        Route::get('incidents/{incident}', [IncidentController::class, 'show']);
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

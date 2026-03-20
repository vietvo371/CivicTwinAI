<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EdgeController;
use App\Http\Controllers\Api\IncidentController;
use App\Http\Controllers\Api\NodeController;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\SensorDataController;
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
        Route::get('predictions', [PredictionController::class, 'index']);
        Route::get('predictions/{prediction}', [PredictionController::class, 'show']);

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
        // Admin specific APIs will go here (e.g. User Management, System Settings)
        // Route::apiResource('users', UserController::class);
    });
});

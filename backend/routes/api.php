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
| CivicTwin AI — API Routes
|--------------------------------------------------------------------------
*/

// Auth (public)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);

    // Graph — Nodes
    Route::get('nodes', [NodeController::class, 'index']);
    Route::get('nodes/{node}', [NodeController::class, 'show']);

    // Graph — Edges
    Route::get('edges', [EdgeController::class, 'index']);
    Route::get('edges/geojson', [EdgeController::class, 'geojson']);
    Route::get('edges/{edge}', [EdgeController::class, 'show']);

    // Sensor Data Ingestion
    Route::post('sensor-data', [SensorDataController::class, 'ingest']);
    Route::post('sensor-data/batch', [SensorDataController::class, 'batchIngest']);

    // Incidents
    Route::get('incidents', [IncidentController::class, 'index']);
    Route::post('incidents', [IncidentController::class, 'store']);
    Route::get('incidents/{incident}', [IncidentController::class, 'show']);
    Route::patch('incidents/{incident}', [IncidentController::class, 'update']);

    // Predictions
    Route::get('predictions', [PredictionController::class, 'index']);
    Route::get('predictions/{prediction}', [PredictionController::class, 'show']);

    // Recommendations
    Route::get('recommendations', [RecommendationController::class, 'index']);
    Route::get('recommendations/{recommendation}', [RecommendationController::class, 'show']);
    Route::patch('recommendations/{recommendation}/approve', [RecommendationController::class, 'approve']);
    Route::patch('recommendations/{recommendation}/reject', [RecommendationController::class, 'reject']);
});


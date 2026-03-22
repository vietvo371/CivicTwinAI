<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Helpers\ApiResponse;

class TrafficSimulationController extends Controller
{
    /**
     * Run a What-If traffic simulation scenario via Python AI Engine
     */
    public function runSimulation(Request $request)
    {
        $request->validate([
            'incident_type' => 'required|string',
            'severity_level' => 'required|string',
            'location_area' => 'required|string',
            'prediction_horizon' => 'required|integer',
        ]);

        $aiServiceUrl = env('AI_SERVICE_URL', 'http://127.0.0.1:8001');

        try {
            $response = Http::timeout(30)->post("{$aiServiceUrl}/api/simulate", [
                'incident_type' => $request->input('incident_type'),
                'severity_level' => $request->input('severity_level'),
                'location_area' => $request->input('location_area'),
                'prediction_horizon' => (int) $request->input('prediction_horizon'),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return ApiResponse::success($data, 'Mô phỏng hoàn tất!');
            }

            return ApiResponse::error('AI Service Error', 502, $response->json());
        } catch (\Exception $e) {
            \Log::error('AI Simulation Error: ' . $e->getMessage());
            return ApiResponse::error('Could not connect to AI Service. Is it running?', 503);
        }
    }
}

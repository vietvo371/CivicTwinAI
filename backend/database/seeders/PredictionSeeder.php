<?php

namespace Database\Seeders;

use App\Models\Prediction;
use App\Models\PredictionEdge;
use Illuminate\Database\Seeder;

class PredictionSeeder extends Seeder
{
    public function run(): void
    {
        $predictions = [
            // Prediction cho incident 1: Va chạm Container Cầu Rồng
            [
                'incident_id' => 1,
                'model_version' => 'GNN-v2.1',
                'status' => 'completed',
                'processing_time_ms' => 342,
                'time_horizon_min' => 30,
                'confidence_score' => 0.92,
                'metadata' => json_encode(['gpu_used' => true, 'batch_size' => 64]),
                'edges' => [
                    ['edge_id' => 3, 'predicted_density' => 0.95, 'predicted_congestion_level' => 'severe', 'time_offset_min' => 5],
                    ['edge_id' => 4, 'predicted_density' => 0.88, 'predicted_congestion_level' => 'heavy', 'time_offset_min' => 10],
                    ['edge_id' => 17, 'predicted_density' => 0.92, 'predicted_congestion_level' => 'severe', 'time_offset_min' => 15],
                    ['edge_id' => 7, 'predicted_density' => 0.75, 'predicted_congestion_level' => 'heavy', 'time_offset_min' => 20],
                    ['edge_id' => 8, 'predicted_density' => 0.80, 'predicted_congestion_level' => 'heavy', 'time_offset_min' => 25],
                ],
            ],
            // Prediction cho incident 2: Xe buýt NVL
            [
                'incident_id' => 2,
                'model_version' => 'LSTM-v1.4',
                'status' => 'completed',
                'processing_time_ms' => 189,
                'time_horizon_min' => 30,
                'confidence_score' => 0.87,
                'metadata' => json_encode(['gpu_used' => false]),
                'edges' => [
                    ['edge_id' => 2, 'predicted_density' => 0.78, 'predicted_congestion_level' => 'heavy', 'time_offset_min' => 5],
                    ['edge_id' => 3, 'predicted_density' => 0.72, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 10],
                    ['edge_id' => 12, 'predicted_density' => 0.68, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 15],
                ],
            ],
            // Prediction cho incident 5: Tai nạn sân bay
            [
                'incident_id' => 5,
                'model_version' => 'GNN-v2.1',
                'status' => 'completed',
                'processing_time_ms' => 567,
                'time_horizon_min' => 60,
                'confidence_score' => 0.94,
                'metadata' => json_encode(['gpu_used' => true, 'batch_size' => 128]),
                'edges' => [
                    ['edge_id' => 14, 'predicted_density' => 0.98, 'predicted_congestion_level' => 'severe', 'time_offset_min' => 5],
                    ['edge_id' => 21, 'predicted_density' => 0.85, 'predicted_congestion_level' => 'heavy', 'time_offset_min' => 10],
                    ['edge_id' => 10, 'predicted_density' => 0.72, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 15],
                    ['edge_id' => 19, 'predicted_density' => 0.65, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 20],
                    ['edge_id' => 9, 'predicted_density' => 0.60, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 30],
                    ['edge_id' => 6, 'predicted_density' => 0.55, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 45],
                ],
            ],
            // Prediction cho incident 6: Ùn tắc Cầu Sông Hàn
            [
                'incident_id' => 6,
                'model_version' => 'GNN-v2.1',
                'status' => 'completed',
                'processing_time_ms' => 298,
                'time_horizon_min' => 30,
                'confidence_score' => 0.89,
                'metadata' => json_encode(['gpu_used' => true]),
                'edges' => [
                    ['edge_id' => 8, 'predicted_density' => 0.90, 'predicted_congestion_level' => 'severe', 'time_offset_min' => 5],
                    ['edge_id' => 7, 'predicted_density' => 0.82, 'predicted_congestion_level' => 'heavy', 'time_offset_min' => 10],
                    ['edge_id' => 1, 'predicted_density' => 0.70, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 15],
                ],
            ],
            // Prediction cho incident 8: Ùn tắc Bạch Đằng Đông
            [
                'incident_id' => 8,
                'model_version' => 'LSTM-v1.4',
                'status' => 'completed',
                'processing_time_ms' => 215,
                'time_horizon_min' => 30,
                'confidence_score' => 0.85,
                'metadata' => json_encode(['gpu_used' => false]),
                'edges' => [
                    ['edge_id' => 17, 'predicted_density' => 0.88, 'predicted_congestion_level' => 'heavy', 'time_offset_min' => 5],
                    ['edge_id' => 4, 'predicted_density' => 0.75, 'predicted_congestion_level' => 'heavy', 'time_offset_min' => 10],
                    ['edge_id' => 20, 'predicted_density' => 0.62, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 15],
                ],
            ],
            // Prediction cho incident 10: Ngập Nguyễn Hữu Thọ
            [
                'incident_id' => 10,
                'model_version' => 'GNN-v2.1',
                'status' => 'completed',
                'processing_time_ms' => 890,
                'time_horizon_min' => 120,
                'confidence_score' => 0.91,
                'metadata' => json_encode(['gpu_used' => true, 'weather_factor' => 'heavy_rain']),
                'edges' => [
                    ['edge_id' => 16, 'predicted_density' => 0.95, 'predicted_congestion_level' => 'severe', 'time_offset_min' => 10],
                    ['edge_id' => 15, 'predicted_density' => 0.78, 'predicted_congestion_level' => 'heavy', 'time_offset_min' => 20],
                    ['edge_id' => 24, 'predicted_density' => 0.72, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 30],
                    ['edge_id' => 13, 'predicted_density' => 0.65, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 60],
                ],
            ],
            // Prediction failed
            [
                'incident_id' => 11,
                'model_version' => 'GNN-v2.1',
                'status' => 'failed',
                'processing_time_ms' => 1200,
                'time_horizon_min' => 30,
                'confidence_score' => 0,
                'metadata' => json_encode(['error' => 'GPU out of memory', 'retry_count' => 2]),
                'edges' => [],
            ],
            // Prediction cho incident 16: Đèn tín hiệu hư
            [
                'incident_id' => 16,
                'model_version' => 'LSTM-v1.4',
                'status' => 'completed',
                'processing_time_ms' => 145,
                'time_horizon_min' => 15,
                'confidence_score' => 0.78,
                'metadata' => json_encode(['gpu_used' => false]),
                'edges' => [
                    ['edge_id' => 1, 'predicted_density' => 0.72, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 5],
                    ['edge_id' => 2, 'predicted_density' => 0.68, 'predicted_congestion_level' => 'moderate', 'time_offset_min' => 10],
                ],
            ],
        ];

        foreach ($predictions as $data) {
            $edges = $data['edges'];
            unset($data['edges']);

            $prediction = Prediction::create($data);

            foreach ($edges as $edge) {
                PredictionEdge::create(array_merge($edge, [
                    'prediction_id' => $prediction->id,
                ]));
            }
        }
    }
}

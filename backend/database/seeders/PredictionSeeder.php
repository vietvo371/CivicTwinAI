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
                'edges' => [
                    ['edge_id' => 3, 'predicted_density' => 0.9500, 'time_horizon_minutes' => 5, 'confidence' => 0.92, 'severity' => 'severe'],
                    ['edge_id' => 4, 'predicted_density' => 0.8800, 'time_horizon_minutes' => 10, 'confidence' => 0.89, 'severity' => 'heavy'],
                    ['edge_id' => 17, 'predicted_density' => 0.9200, 'time_horizon_minutes' => 15, 'confidence' => 0.87, 'severity' => 'severe'],
                    ['edge_id' => 7, 'predicted_density' => 0.7500, 'time_horizon_minutes' => 20, 'confidence' => 0.82, 'severity' => 'heavy'],
                    ['edge_id' => 8, 'predicted_density' => 0.8000, 'time_horizon_minutes' => 25, 'confidence' => 0.80, 'severity' => 'heavy'],
                ],
            ],
            // Prediction cho incident 2: Xe buýt NVL
            [
                'incident_id' => 2,
                'model_version' => 'LSTM-v1.4',
                'status' => 'completed',
                'processing_time_ms' => 189,
                'edges' => [
                    ['edge_id' => 2, 'predicted_density' => 0.7800, 'time_horizon_minutes' => 5, 'confidence' => 0.87, 'severity' => 'heavy'],
                    ['edge_id' => 3, 'predicted_density' => 0.7200, 'time_horizon_minutes' => 10, 'confidence' => 0.84, 'severity' => 'moderate'],
                    ['edge_id' => 12, 'predicted_density' => 0.6800, 'time_horizon_minutes' => 15, 'confidence' => 0.81, 'severity' => 'moderate'],
                ],
            ],
            // Prediction cho incident 5: Tai nạn sân bay
            [
                'incident_id' => 5,
                'model_version' => 'GNN-v2.1',
                'status' => 'completed',
                'processing_time_ms' => 567,
                'edges' => [
                    ['edge_id' => 14, 'predicted_density' => 0.9800, 'time_horizon_minutes' => 5, 'confidence' => 0.94, 'severity' => 'severe'],
                    ['edge_id' => 21, 'predicted_density' => 0.8500, 'time_horizon_minutes' => 10, 'confidence' => 0.90, 'severity' => 'heavy'],
                    ['edge_id' => 10, 'predicted_density' => 0.7200, 'time_horizon_minutes' => 15, 'confidence' => 0.86, 'severity' => 'moderate'],
                    ['edge_id' => 19, 'predicted_density' => 0.6500, 'time_horizon_minutes' => 20, 'confidence' => 0.83, 'severity' => 'moderate'],
                    ['edge_id' => 9, 'predicted_density' => 0.6000, 'time_horizon_minutes' => 30, 'confidence' => 0.78, 'severity' => 'moderate'],
                    ['edge_id' => 6, 'predicted_density' => 0.5500, 'time_horizon_minutes' => 45, 'confidence' => 0.74, 'severity' => 'light'],
                ],
            ],
            // Prediction cho incident 6: Ùn tắc Cầu Sông Hàn
            [
                'incident_id' => 6,
                'model_version' => 'GNN-v2.1',
                'status' => 'completed',
                'processing_time_ms' => 298,
                'edges' => [
                    ['edge_id' => 8, 'predicted_density' => 0.9000, 'time_horizon_minutes' => 5, 'confidence' => 0.89, 'severity' => 'severe'],
                    ['edge_id' => 7, 'predicted_density' => 0.8200, 'time_horizon_minutes' => 10, 'confidence' => 0.85, 'severity' => 'heavy'],
                    ['edge_id' => 1, 'predicted_density' => 0.7000, 'time_horizon_minutes' => 15, 'confidence' => 0.80, 'severity' => 'moderate'],
                ],
            ],
            // Prediction cho incident 8: Ùn tắc Bạch Đằng Đông
            [
                'incident_id' => 8,
                'model_version' => 'LSTM-v1.4',
                'status' => 'completed',
                'processing_time_ms' => 215,
                'edges' => [
                    ['edge_id' => 17, 'predicted_density' => 0.8800, 'time_horizon_minutes' => 5, 'confidence' => 0.85, 'severity' => 'heavy'],
                    ['edge_id' => 4, 'predicted_density' => 0.7500, 'time_horizon_minutes' => 10, 'confidence' => 0.82, 'severity' => 'heavy'],
                    ['edge_id' => 20, 'predicted_density' => 0.6200, 'time_horizon_minutes' => 15, 'confidence' => 0.78, 'severity' => 'moderate'],
                ],
            ],
            // Prediction cho incident 10: Ngập Nguyễn Hữu Thọ
            [
                'incident_id' => 10,
                'model_version' => 'GNN-v2.1',
                'status' => 'completed',
                'processing_time_ms' => 890,
                'edges' => [
                    ['edge_id' => 16, 'predicted_density' => 0.9500, 'time_horizon_minutes' => 10, 'confidence' => 0.91, 'severity' => 'severe'],
                    ['edge_id' => 15, 'predicted_density' => 0.7800, 'time_horizon_minutes' => 20, 'confidence' => 0.87, 'severity' => 'heavy'],
                    ['edge_id' => 24, 'predicted_density' => 0.7200, 'time_horizon_minutes' => 30, 'confidence' => 0.83, 'severity' => 'moderate'],
                    ['edge_id' => 13, 'predicted_density' => 0.6500, 'time_horizon_minutes' => 60, 'confidence' => 0.79, 'severity' => 'moderate'],
                ],
            ],
            // Prediction failed
            [
                'incident_id' => 11,
                'model_version' => 'GNN-v2.1',
                'status' => 'failed',
                'processing_time_ms' => 1200,
                'error_message' => 'GPU out of memory after 2 retries',
                'edges' => [],
            ],
            // Prediction cho incident 16: Đèn tín hiệu hư
            [
                'incident_id' => 16,
                'model_version' => 'LSTM-v1.4',
                'status' => 'completed',
                'processing_time_ms' => 145,
                'edges' => [
                    ['edge_id' => 1, 'predicted_density' => 0.7200, 'time_horizon_minutes' => 5, 'confidence' => 0.78, 'severity' => 'moderate'],
                    ['edge_id' => 2, 'predicted_density' => 0.6800, 'time_horizon_minutes' => 10, 'confidence' => 0.75, 'severity' => 'moderate'],
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

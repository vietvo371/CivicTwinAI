<?php

namespace Database\Seeders;

use App\Models\Recommendation;
use Illuminate\Database\Seeder;

class RecommendationSeeder extends Seeder
{
    public function run(): void
    {
        $recommendations = [
            // === REROUTE recommendations ===
            [
                'prediction_id' => 1,
                'incident_id' => 1,
                'type' => 'reroute',
                'title' => 'Chuyển hướng lưu thông qua Cầu Thuận Phước',
                'description' => 'Đề xuất chuyển hướng xe từ Hải Châu sang Sơn Trà qua Cầu Thuận Phước thay vì Cầu Rồng do tai nạn container.',
                'status' => 'approved',
                'approved_by' => 3,
                'approved_at' => now()->subMinutes(45),
                'metadata' => json_encode([
                    'affected_edges' => [3, 4, 17],
                    'alternative_route' => [25, 11],
                    'estimated_delay_reduction_min' => 12,
                ]),
            ],
            [
                'prediction_id' => 3,
                'incident_id' => 5,
                'type' => 'reroute',
                'title' => 'Chuyển hướng vào sân bay qua đường Ngã ba Huế',
                'description' => 'Do tai nạn liên hoàn trước sân bay, đề xuất xe từ phía Bắc đi Ngã ba Huế → đường nội bộ sân bay.',
                'status' => 'approved',
                'approved_by' => 3,
                'approved_at' => now()->subMinutes(20),
                'metadata' => json_encode([
                    'affected_edges' => [14, 21],
                    'alternative_route' => [19, 21],
                    'estimated_delay_reduction_min' => 18,
                ]),
            ],
            [
                'prediction_id' => 5,
                'incident_id' => 8,
                'type' => 'reroute',
                'title' => 'Chuyển lưu lượng Bạch Đằng Đông sang Cầu Trần Thị Lý',
                'description' => 'Mật độ Bạch Đằng Đông quá cao, đề xuất xe hướng Ngũ Hành Sơn đi Cầu Trần Thị Lý thay vì qua Bạch Đằng.',
                'status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
                'metadata' => json_encode([
                    'affected_edges' => [17, 20],
                    'alternative_route' => [24, 15],
                    'estimated_delay_reduction_min' => 8,
                ]),
            ],

            // === PRIORITY ROUTE recommendations ===
            [
                'prediction_id' => 1,
                'incident_id' => 1,
                'type' => 'priority_route',
                'title' => 'Mở tuyến ưu tiên xe cấp cứu đến Cầu Rồng',
                'description' => 'Kích hoạt tuyến ưu tiên cho xe cấp cứu từ BV Đà Nẵng đến hiện trường tai nạn Cầu Rồng. Clear 4 đèn giao thông.',
                'status' => 'approved',
                'approved_by' => 3,
                'approved_at' => now()->subMinutes(50),
                'metadata' => json_encode([
                    'origin_node' => 5,
                    'destination_node' => 3,
                    'cleared_intersections' => 4,
                    'estimated_eta_min' => 6,
                ]),
            ],
            [
                'prediction_id' => 3,
                'incident_id' => 5,
                'type' => 'priority_route',
                'title' => 'Tuyến ưu tiên cứu hộ đến sân bay',
                'description' => 'Mở đường ưu tiên cho đội cứu hộ từ Trạm PCCC Thanh Khê đến sân bay Đà Nẵng.',
                'status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
                'metadata' => json_encode([
                    'origin_node' => 16,
                    'destination_node' => 15,
                    'cleared_intersections' => 3,
                    'estimated_eta_min' => 8,
                ]),
            ],

            // === ALERT recommendations ===
            [
                'prediction_id' => 6,
                'incident_id' => 10,
                'type' => 'alert',
                'title' => 'Cảnh báo ngập cho khu vực Cẩm Lệ - Ngũ Hành Sơn',
                'description' => 'Gửi push notification cảnh báo ngập nước đến tất cả citizens trong bán kính 5km quanh Nguyễn Hữu Thọ.',
                'status' => 'approved',
                'approved_by' => 4,
                'approved_at' => now()->subMinutes(30),
                'metadata' => json_encode([
                    'alert_radius_km' => 5,
                    'estimated_affected_citizens' => 12500,
                    'channels' => ['push', 'sms'],
                ]),
            ],
            [
                'prediction_id' => 4,
                'incident_id' => 6,
                'type' => 'alert',
                'title' => 'Cảnh báo kẹt xe Cầu Sông Hàn giờ cao điểm',
                'description' => 'Gửi cảnh báo đến citizens hướng từ Hải Châu sang Sơn Trà: nên sử dụng Cầu Rồng hoặc Cầu Thuận Phước.',
                'status' => 'approved',
                'approved_by' => 3,
                'approved_at' => now()->subHours(1),
                'metadata' => json_encode([
                    'alert_radius_km' => 3,
                    'estimated_affected_citizens' => 8200,
                    'channels' => ['push'],
                ]),
            ],

            // === REJECTED recommendation ===
            [
                'prediction_id' => 8,
                'incident_id' => 16,
                'type' => 'reroute',
                'title' => 'Chuyển hướng đường Lê Duẩn do hư đèn tín hiệu',
                'description' => 'Đề xuất tạm thời cấm hướng Lê Duẩn → ĐBP cho đến khi sửa đèn.',
                'status' => 'rejected',
                'approved_by' => 3,
                'approved_at' => now()->subMinutes(15),
                'metadata' => json_encode([
                    'rejection_reason' => 'Đã cử đội sửa đèn, dự kiến xong trong 30 phút. Không cần cấm đường.',
                    'affected_edges' => [1],
                ]),
            ],
            [
                'prediction_id' => 2,
                'incident_id' => 2,
                'type' => 'alert',
                'title' => 'Cảnh báo khu vực Nguyễn Văn Linh do xe buýt gặp nạn',
                'description' => 'Gửi cảnh báo tránh khu vực NVL đoạn gần Điện Biên Phủ.',
                'status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
                'metadata' => json_encode([
                    'alert_radius_km' => 2,
                    'estimated_affected_citizens' => 4500,
                    'channels' => ['push'],
                ]),
            ],
        ];

        foreach ($recommendations as $data) {
            Recommendation::create($data);
        }
    }
}

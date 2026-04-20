<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SensorReadingSeeder extends Seeder
{
    public function run(): void
    {
        $edgeConfigs = [
            // edge_id => [base_density, variation, spike_hour_indices]
            // Density pattern: thấp ban ngày, cao giờ cao điểm (index 5-8)
            1  => [0.35, 0.15, [5, 6, 7, 8]],   // Lê Duẩn
            2  => [0.52, 0.20, [6, 7, 8]],       // Điện Biên Phủ
            3  => [0.68, 0.22, [5, 6, 7, 8, 9]],// Nguyễn Văn Linh
            4  => [0.55, 0.18, [7, 8]],           // Cầu Rồng
            5  => [0.30, 0.12, [6, 7]],           // Trần Phú
            6  => [0.38, 0.14, [6, 7]],           // Ông Ích Khiêm
            7  => [0.58, 0.20, [5, 6, 7, 8]],    // Lê Duẩn (cầu SH)
            8  => [0.65, 0.22, [6, 7, 8, 9]],     // Cầu Sông Hàn
            9  => [0.25, 0.10, [5, 6]],            // Ng.Tri Phương
            10 => [0.42, 0.16, [6, 7]],            // Phạm Văn Đồng
            11 => [0.35, 0.12, [7, 8]],            // Cầu Thuận Phước
            12 => [0.50, 0.18, [6, 7]],            // Ng.Văn Linh (LĐL)
            13 => [0.32, 0.12, [5, 6]],           // Hoàng Diệu
            14 => [0.58, 0.20, [5, 6, 7]],        // Ng.Văn Linh (sân bay)
            15 => [0.38, 0.14, [6, 7]],           // Cầu Trần Thị Lý
            16 => [0.42, 0.15, [6, 7]],           // Điện Biên Phủ (LĐL)
            17 => [0.72, 0.20, [5, 6, 7, 8, 9]], // Bạch Đằng Đông
            18 => [0.18, 0.08, [5, 6]],           // Võ Văn Kiệt → NTP
            19 => [0.28, 0.10, [5, 6]],           // Võ Văn Kiệt → Ngã ba Huế
            20 => [0.44, 0.15, [6, 7]],           // Lê Văn Hiến
            21 => [0.38, 0.14, [6, 7]],            // Ngã ba Huế → Sân bay
            22 => [0.24, 0.10, [5, 6]],           // Trưng Nữ Vương
            23 => [0.52, 0.18, [5, 6, 7]],        // Ng.Văn Linh (HĐ)
            24 => [0.40, 0.15, [6, 7]],           // Hoàng Diệu (TTL)
            25 => [0.30, 0.12, [5, 6]],           // Ng.Tri Phương (cầu TP)
        ];

        $now = now();
        $records = [];

        // 12 readings per edge, one per hour for the past 12 hours
        for ($hour = 11; $hour >= 0; $hour--) {
            $recordedAt = $now->copy()->subHours($hour);

            foreach ($edgeConfigs as $edgeId => $config) {
                [$base, $variation, $spikeHours] = $config;

                // Hour-of-day pattern: 5-9 = rush, 11-14 = lunch, 16-20 = rush
                $hourOfDay = (int) $recordedAt->format('H');
                $isRush = ($hourOfDay >= 7 && $hourOfDay <= 9) || ($hourOfDay >= 16 && $hourOfDay <= 19);
                $isLunch = ($hourOfDay >= 11 && $hourOfDay <= 13);

                // Density modifier based on time of day
                $modifier = 1.0;
                if ($isRush) {
                    $modifier = 1.4;
                } elseif ($isLunch) {
                    $modifier = 1.15;
                }

                // Random variation
                $noise = (mt_rand(-100, 100) / 1000) * $variation;
                $density = max(0.05, min(0.95, $base * $modifier + $noise));

                $avgSpeed = max(15, 60 - $density * 40 + (mt_rand(-50, 50) / 10));
                $vehicleCount = (int) ($density * 200 + mt_rand(5, 30));

                $records[] = [
                    'edge_id'       => $edgeId,
                    'sensor_id'     => $edgeId, // sensor matches edge id for simplicity
                    'recorded_at'   => $recordedAt->format('Y-m-d H:i:s'),
                    'vehicle_count' => $vehicleCount,
                    'avg_speed_kmh' => round($avgSpeed, 2),
                    'occupancy_pct' => round($density * 100, 2),
                    'density'       => round($density, 4),
                    'data_quality'  => 0.95 + (mt_rand(0, 50) / 1000),
                    'is_anomaly'    => false,
                    'created_at'    => $recordedAt->format('Y-m-d H:i:s'),
                ];
            }
        }

        // Insert in chunks to avoid huge single queries
        foreach (array_chunk($records, 100) as $chunk) {
            DB::table('sensor_readings')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($records) . ' sensor readings for ' . count($edgeConfigs) . ' edges.');
    }
}

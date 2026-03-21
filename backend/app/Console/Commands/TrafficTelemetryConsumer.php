<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;
use App\Events\TrafficDensityUpdated;

class TrafficTelemetryConsumer extends Command
{
    protected $signature = 'traffic:consume';
    protected $description = 'Lắng nghe kênh traffic_telemetry qua Redis Pub/Sub và xử lý dữ liệu realtime';

    public function handle()
    {
        $this->info("Bắt đầu lắng nghe kênh Redis 'traffic_telemetry'...");

        // Subscribe blocking mode in Redis
        Redis::subscribe(['traffic_telemetry'], function (string $message) {
            $telemetryBatch = json_decode($message, true);

            if (!is_array($telemetryBatch)) {
                return;
            }

            // Gửi cục bộ qua socket Laravel Reverb (Soketi) -> MapBox NextJS
            broadcast(new TrafficDensityUpdated($telemetryBatch));
            
            $this->info(sprintf("[%s] Đã nhận và broadcast %d bản ghi tọa độ xe.", now()->format('H:i:s'), count($telemetryBatch)));
        });
    }
}

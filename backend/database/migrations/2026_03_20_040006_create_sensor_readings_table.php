<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE sensor_readings (
                id BIGSERIAL,
                sensor_id BIGINT NOT NULL REFERENCES sensors(id),
                edge_id BIGINT NOT NULL REFERENCES edges(id),
                recorded_at TIMESTAMP NOT NULL,
                vehicle_count INTEGER,
                avg_speed_kmh DECIMAL(6,2),
                occupancy_pct DECIMAL(5,2),
                density DECIMAL(5,4),
                data_quality DECIMAL(3,2) DEFAULT 1.0,
                is_anomaly BOOLEAN DEFAULT false,
                raw_data JSONB,
                PRIMARY KEY (id, recorded_at)
            ) PARTITION BY RANGE (recorded_at)
        ");

        // Create partition for current month
        $year = date('Y');
        $month = date('m');
        $nextMonth = date('Y-m', strtotime('+1 month'));

        DB::statement("
            CREATE TABLE sensor_readings_{$year}_{$month}
            PARTITION OF sensor_readings
            FOR VALUES FROM ('{$year}-{$month}-01') TO ('{$nextMonth}-01')
        ");

        DB::statement('CREATE INDEX idx_sensor_readings_edge_time ON sensor_readings (edge_id, recorded_at DESC)');
        DB::statement('CREATE INDEX idx_sensor_readings_sensor_time ON sensor_readings (sensor_id, recorded_at DESC)');
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS sensor_readings CASCADE');
    }
};

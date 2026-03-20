<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            // Simplified sensor_readings for SQLite test env
            Schema::create('sensor_readings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('sensor_id')->constrained('sensors');
                $table->foreignId('edge_id')->constrained('edges');
                $table->timestamp('recorded_at');
                $table->integer('vehicle_count')->nullable();
                $table->decimal('avg_speed_kmh', 6, 2)->nullable();
                $table->decimal('occupancy_pct', 5, 2)->nullable();
                $table->decimal('density', 5, 4)->nullable();
                $table->decimal('data_quality', 3, 2)->default(1.0);
                $table->boolean('is_anomaly')->default(false);
                $table->json('raw_data')->nullable();
            });
            return;
        }

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
        if (DB::connection()->getDriverName() === 'sqlite') {
            Schema::dropIfExists('sensor_readings');
            return;
        }
        DB::statement('DROP TABLE IF EXISTS sensor_readings CASCADE');
    }
};

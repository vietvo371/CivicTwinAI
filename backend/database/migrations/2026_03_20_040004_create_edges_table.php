<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('edges', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('source_node_id')->constrained('nodes');
            $table->foreignId('target_node_id')->constrained('nodes');
            $table->decimal('length_m', 10, 2);
            $table->smallInteger('lanes')->default(2);
            $table->smallInteger('speed_limit_kmh')->default(50);
            $table->string('direction', 10)->default('two_way');
            $table->string('road_type', 50)->default('urban');

            // Realtime metrics
            $table->decimal('current_density', 5, 4)->default(0);
            $table->decimal('current_speed_kmh', 6, 2)->default(0);
            $table->decimal('current_flow', 8, 2)->default(0);
            $table->string('congestion_level', 20)->default('none');
            $table->string('status', 20)->default('normal');
            $table->timestamp('metrics_updated_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('source_node_id');
            $table->index('target_node_id');
            $table->index('congestion_level');
            $table->index('status');
            $table->index('metrics_updated_at');
        });

        DB::statement('ALTER TABLE edges ADD COLUMN geometry geometry(LineString, 4326) NOT NULL');
        DB::statement('CREATE INDEX edges_geometry_gist ON edges USING GIST(geometry)');
        DB::statement('ALTER TABLE edges ADD CONSTRAINT edges_no_self_loop CHECK (source_node_id != target_node_id)');
    }

    public function down(): void
    {
        Schema::dropIfExists('edges');
    }
};

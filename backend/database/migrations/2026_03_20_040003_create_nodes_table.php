<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nodes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type', 50)->default('intersection');
            $table->foreignId('zone_id')->nullable()->constrained('zones')->nullOnDelete();
            $table->boolean('has_traffic_light')->default(false);
            $table->jsonb('metadata')->default('{}');
            $table->string('status', 20)->default('active');
            $table->timestamps();
            $table->softDeletes();

            $table->index('zone_id');
            $table->index('type');
        });

        if (DB::connection()->getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE nodes ADD COLUMN location geometry(Point, 4326) NOT NULL');
            DB::statement('CREATE INDEX nodes_location_gist ON nodes USING GIST(location)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('nodes');
    }
};

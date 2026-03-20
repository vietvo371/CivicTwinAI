<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sensors', function (Blueprint $table) {
            $table->id();
            $table->string('sensor_code', 100)->unique();
            $table->foreignId('edge_id')->constrained('edges');
            $table->string('type', 50);
            $table->string('model', 100)->nullable();
            $table->string('firmware_version', 50)->nullable();
            $table->string('status', 20)->default('online');
            $table->timestamp('last_active_at')->nullable();
            $table->jsonb('metadata')->default('{}');
            $table->timestamp('installed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('edge_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sensors');
    }
};

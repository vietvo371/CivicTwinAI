<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prediction_edges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prediction_id')->constrained('predictions')->cascadeOnDelete();
            $table->foreignId('edge_id')->constrained('edges');
            $table->smallInteger('time_horizon_minutes');
            $table->decimal('predicted_density', 5, 4)->nullable();
            $table->integer('predicted_delay_s')->nullable();
            $table->decimal('confidence', 3, 2)->nullable();
            $table->string('severity', 20)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('prediction_id');
            $table->index('edge_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prediction_edges');
    }
};

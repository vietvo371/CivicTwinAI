<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('incident_id')->nullable()->constrained('incidents')->nullOnDelete();
            $table->string('model_version', 50);
            $table->integer('processing_time_ms')->nullable();
            $table->string('status', 20)->default('completed');
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('incident_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('predictions');
    }
};

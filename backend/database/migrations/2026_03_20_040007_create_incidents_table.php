<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type', 50);
            $table->string('severity', 20);
            $table->string('status', 20)->default('open');
            $table->string('source', 30);
            $table->foreignId('reported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->jsonb('metadata')->default('{}');
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('severity');
            $table->index(['created_at']);
        });

        DB::statement('ALTER TABLE incidents ADD COLUMN location geometry(Point, 4326)');
        DB::statement('CREATE INDEX incidents_location_gist ON incidents USING GIST(location)');
        DB::statement('ALTER TABLE incidents ADD COLUMN affected_edge_ids BIGINT[] DEFAULT \'{}\'');
        DB::statement('CREATE INDEX incidents_edge_ids_gin ON incidents USING GIN(affected_edge_ids)');
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};

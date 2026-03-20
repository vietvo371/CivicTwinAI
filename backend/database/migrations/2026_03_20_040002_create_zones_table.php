<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique()->nullable();
            $table->string('type', 50)->default('district');
            $table->jsonb('metadata')->default('{}');
            $table->timestamps();
        });

        DB::statement('ALTER TABLE zones ADD COLUMN boundary geometry(Polygon, 4326) NOT NULL');
        DB::statement('CREATE INDEX zones_boundary_gist ON zones USING GIST(boundary)');
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};

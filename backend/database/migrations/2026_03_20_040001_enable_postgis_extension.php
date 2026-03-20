<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') return;
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis');
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') return;
        DB::statement('DROP EXTENSION IF EXISTS postgis');
    }
};

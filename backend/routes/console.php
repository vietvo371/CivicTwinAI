<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Decay traffic density every 5 minutes — density 0.9 → ~0.35 after 30 min
Schedule::job(\App\Jobs\DecayTrafficDensity::class)->everyFiveMinutes();

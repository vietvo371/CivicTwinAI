<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DecayTrafficDensity implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // Decay 8% mỗi 5 phút → density 0.9 về ~0.35 sau 30 phút
    private const DECAY_RATE = 0.92;

    // Ngưỡng baseline: dưới mức này không decay thêm (đường đã thông tự nhiên)
    private const BASELINE_DENSITY = 0.30;

    public function handle(): void
    {
        // Chỉ decay các edges có density trên baseline
        $updated = DB::table('edges')
            ->where('current_density', '>', self::BASELINE_DENSITY)
            ->whereNull('deleted_at')
            ->update([
                'current_density' => DB::raw(
                    'GREATEST(ROUND((current_density * ' . self::DECAY_RATE . ')::numeric, 4), ' . self::BASELINE_DENSITY . ')'
                ),
                'current_speed_kmh' => DB::raw(
                    'ROUND((speed_limit_kmh * (1.0 - GREATEST(current_density * ' . self::DECAY_RATE . ', ' . self::BASELINE_DENSITY . ')) * 0.9)::numeric, 1)'
                ),
                'congestion_level' => DB::raw("
                    CASE
                        WHEN current_density * " . self::DECAY_RATE . " > 0.80 THEN 'critical'
                        WHEN current_density * " . self::DECAY_RATE . " > 0.60 THEN 'heavy'
                        WHEN current_density * " . self::DECAY_RATE . " > 0.40 THEN 'moderate'
                        WHEN current_density * " . self::DECAY_RATE . " > 0.30 THEN 'light'
                        ELSE 'none'
                    END
                "),
                'metrics_updated_at' => now(),
            ]);

        Log::info("TrafficDecay: {$updated} edges decayed @ " . self::DECAY_RATE . "x");

        // Broadcast updated GeoJSON snapshot to all connected clients
        \App\Events\TrafficDensityDecayed::dispatch();
    }
}

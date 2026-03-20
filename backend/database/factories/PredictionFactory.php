<?php

namespace Database\Factories;

use App\Models\Incident;
use Illuminate\Database\Eloquent\Factories\Factory;

class PredictionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'incident_id' => Incident::factory(),
            'model_version' => 'test_v0.1',
            'processing_time_ms' => fake()->numberBetween(50, 500),
            'status' => 'completed',
        ];
    }
}

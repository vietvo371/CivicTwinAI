<?php

namespace Database\Factories;

use App\Models\Prediction;
use Illuminate\Database\Eloquent\Factories\Factory;

class PredictionEdgeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'prediction_id' => Prediction::factory(),
            'edge_id' => 1,
            'time_horizon_minutes' => fake()->randomElement([15, 30, 60]),
            'predicted_density' => fake()->randomFloat(4, 0.3, 0.95),
            'predicted_delay_s' => fake()->numberBetween(30, 300),
            'confidence' => fake()->randomFloat(2, 0.5, 0.95),
            'severity' => fake()->randomElement(['medium', 'high', 'critical']),
        ];
    }
}

<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class IncidentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'type' => fake()->randomElement(['accident', 'congestion', 'construction', 'weather', 'other']),
            'severity' => fake()->randomElement(['low', 'medium', 'high', 'critical']),
            'status' => 'open',
            'source' => fake()->randomElement(['operator', 'citizen', 'auto_detected']),
            'metadata' => [],
        ];
    }
}

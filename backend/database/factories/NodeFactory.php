<?php

namespace Database\Factories;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

class NodeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => 'Node ' . fake()->unique()->numberBetween(1, 999),
            'type' => 'intersection',
            'zone_id' => Zone::factory(),
            'has_traffic_light' => fake()->boolean(),
            'metadata' => [],
            'status' => 'active',
        ];
    }
}

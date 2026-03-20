<?php

namespace Database\Factories;

use App\Models\Node;
use Illuminate\Database\Eloquent\Factories\Factory;

class EdgeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->streetName(),
            'source_node_id' => Node::factory(),
            'target_node_id' => Node::factory(),
            'length_m' => fake()->randomFloat(2, 100, 2000),
            'lanes' => fake()->randomElement([2, 3, 4]),
            'speed_limit_kmh' => fake()->randomElement([40, 50, 60]),
            'direction' => 'two_way',
            'road_type' => 'urban',
        ];
    }
}

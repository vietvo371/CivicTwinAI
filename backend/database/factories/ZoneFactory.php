<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ZoneFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->city(),
            'code' => fake()->unique()->lexify('???-###'),
            'type' => 'district',
            'metadata' => [],
        ];
    }
}

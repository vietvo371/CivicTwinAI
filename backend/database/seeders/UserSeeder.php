<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Super Admin
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@civictwin.local',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('super_admin');

        // City Admin
        $cityAdmin = User::create([
            'name' => 'City Admin',
            'email' => 'cityadmin@civictwin.local',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $cityAdmin->assignRole('city_admin');

        // Traffic Operator
        $operator = User::create([
            'name' => 'Traffic Operator',
            'email' => 'operator@civictwin.local',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $operator->assignRole('traffic_operator');

        // Urban Planner
        $planner = User::create([
            'name' => 'Urban Planner',
            'email' => 'planner@civictwin.local',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);
        $planner->assignRole('urban_planner');
    }
}

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
            'name' => 'Nguyễn Văn Admin',
            'email' => 'admin@civictwin.local',
            'password' => Hash::make('password'),
            'phone' => '0901000001',
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('super_admin');

        // City Admin
        $cityAdmin = User::create([
            'name' => 'Trần Thị Huyền',
            'email' => 'cityadmin@civictwin.local',
            'password' => Hash::make('password'),
            'phone' => '0901000002',
            'email_verified_at' => now(),
        ]);
        $cityAdmin->assignRole('city_admin');

        // Traffic Operator 1
        $operator1 = User::create([
            'name' => 'Lê Hoàng Nam',
            'email' => 'operator@civictwin.local',
            'password' => Hash::make('password'),
            'phone' => '0901000003',
            'email_verified_at' => now(),
        ]);
        $operator1->assignRole('traffic_operator');

        // Traffic Operator 2
        $operator2 = User::create([
            'name' => 'Phạm Minh Tuấn',
            'email' => 'operator2@civictwin.local',
            'password' => Hash::make('password'),
            'phone' => '0901000004',
            'email_verified_at' => now(),
        ]);
        $operator2->assignRole('traffic_operator');

        // Urban Planner
        $planner = User::create([
            'name' => 'Võ Thanh Bình',
            'email' => 'planner@civictwin.local',
            'password' => Hash::make('password'),
            'phone' => '0901000005',
            'email_verified_at' => now(),
        ]);
        $planner->assignRole('urban_planner');

        // Emergency Services
        $emergency = User::create([
            'name' => 'Đội Cứu Hộ Đà Nẵng',
            'email' => 'emergency@civictwin.local',
            'password' => Hash::make('password'),
            'phone' => '0901000006',
            'email_verified_at' => now(),
        ]);
        $emergency->assignRole('emergency');

        // Citizen 1
        $citizen1 = User::create([
            'name' => 'Nguyễn Văn Minh',
            'email' => 'citizen@gmail.com',
            'password' => Hash::make('password'),
            'phone' => '0901000007',
            'email_verified_at' => now(),
        ]);
        $citizen1->assignRole('citizen');

        // Citizen 2
        $citizen2 = User::create([
            'name' => 'Trần Thị Mai',
            'email' => 'citizen2@gmail.com',
            'password' => Hash::make('password'),
            'phone' => '0901000008',
            'email_verified_at' => now(),
        ]);
        $citizen2->assignRole('citizen');
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Dashboard
            'dashboard.view', 'dashboard.configure',
            // Map
            'map.view', 'map.edit-layers',
            // Incidents
            'incidents.view', 'incidents.create', 'incidents.update', 'incidents.delete', 'incidents.assign',
            // Predictions
            'predictions.view', 'predictions.trigger',
            // Recommendations
            'recommendations.view', 'recommendations.approve', 'recommendations.reject',
            // Simulation
            'simulation.run', 'simulation.view-results',
            // Reports
            'reports.view', 'reports.export',
            // Users
            'users.view', 'users.create', 'users.update', 'users.delete', 'users.assign-roles',
            // Sensors
            'sensors.view', 'sensors.manage',
            // System
            'system.settings', 'system.logs',
            // Priority Route
            'priority-route.request',
            // Notifications
            'notifications.send',
            // Citizen
            'citizen-reports.create', 'citizen-reports.view-own',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }
        
        // Clear cache again after creating permissions to avoid cache misses
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Super Admin — full access (bypass all permissions via Gate::before)
        Role::create(['name' => 'super_admin']);

        // City Admin
        $cityAdmin = Role::create(['name' => 'city_admin']);
        $cityAdmin->givePermissionTo([
            'dashboard.view', 'dashboard.configure',
            'map.view', 'map.edit-layers',
            'incidents.view', 'incidents.create', 'incidents.update', 'incidents.delete', 'incidents.assign',
            'predictions.view', 'predictions.trigger',
            'recommendations.view', 'recommendations.approve', 'recommendations.reject',
            'simulation.run', 'simulation.view-results',
            'reports.view', 'reports.export',
            'users.view', 'users.create', 'users.update', 'users.delete', 'users.assign-roles',
            'sensors.view', 'sensors.manage',
            'system.settings', 'system.logs',
            'priority-route.request',
            'notifications.send',
        ]);

        // Traffic Operator
        $operator = Role::create(['name' => 'traffic_operator']);
        $operator->givePermissionTo([
            'dashboard.view',
            'map.view', 'map.edit-layers',
            'incidents.view', 'incidents.create', 'incidents.update', 'incidents.assign',
            'predictions.view', 'predictions.trigger',
            'recommendations.view', 'recommendations.approve', 'recommendations.reject',
            'sensors.view',
            'notifications.send',
        ]);

        // Urban Planner
        $planner = Role::create(['name' => 'urban_planner']);
        $planner->givePermissionTo([
            'dashboard.view',
            'map.view',
            'predictions.view',
            'simulation.run', 'simulation.view-results',
            'reports.view',
        ]);

        // Emergency Services
        $emergency = Role::create(['name' => 'emergency']);
        $emergency->givePermissionTo([
            'map.view',
            'incidents.view',
            'predictions.view',
            'priority-route.request',
        ]);

        // Citizen
        $citizen = Role::create(['name' => 'citizen']);
        $citizen->givePermissionTo([
            'citizen-reports.create',
            'citizen-reports.view-own',
        ]);
    }
}

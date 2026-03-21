<?php

return [
    // === User Roles ===
    'roles' => [
        'super_admin' => 'Super Admin',
        'city_admin' => 'City Admin',
        'traffic_operator' => 'Traffic Operator',
        'urban_planner' => 'Urban Planner',
        'emergency' => 'Emergency Services',
        'citizen' => 'Citizen',
    ],

    // === Incident ===
    'incident_type' => [
        'accident' => 'Accident',
        'congestion' => 'Congestion',
        'construction' => 'Construction',
        'weather' => 'Weather',
        'other' => 'Other',
    ],
    'incident_severity' => [
        'low' => 'Low',
        'medium' => 'Medium',
        'high' => 'High',
        'critical' => 'Critical',
    ],
    'incident_status' => [
        'open' => 'Open',
        'investigating' => 'Investigating',
        'resolved' => 'Resolved',
        'closed' => 'Closed',
    ],
    'incident_source' => [
        'operator' => 'Operator',
        'citizen' => 'Citizen',
        'auto_detected' => 'Auto-detected',
    ],

    // === Edge (Road Segment) ===
    'congestion_level' => [
        'none' => 'Free Flow',
        'light' => 'Light',
        'moderate' => 'Moderate',
        'heavy' => 'Heavy',
        'severe' => 'Severe',
    ],
    'direction' => [
        'one_way' => 'One Way',
        'two_way' => 'Two Way',
    ],
    'road_type' => [
        'highway' => 'Highway',
        'arterial' => 'Arterial',
        'collector' => 'Collector',
        'local' => 'Local',
        'residential' => 'Residential',
        'urban' => 'Urban',
        'bridge' => 'Bridge',
    ],

    // === Sensor ===
    'sensor_type' => [
        'camera' => 'Camera',
        'loop_detector' => 'Loop Detector',
        'radar' => 'Radar',
        'weather' => 'Weather',
        'camera_feed' => 'Camera Feed',
        'traffic_counter' => 'Traffic Counter',
        'weather_station' => 'Weather Station',
    ],
    'sensor_status' => [
        'active' => 'Active',
        'maintenance' => 'Maintenance',
        'offline' => 'Offline',
        'online' => 'Online',
    ],

    // === Node ===
    'node_type' => [
        'intersection' => 'Intersection',
        'roundabout' => 'Roundabout',
        'terminal' => 'Terminal',
        'merge' => 'Merge Point',
        'bridge' => 'Bridge',
        'landmark' => 'Landmark',
    ],
    'node_status' => [
        'active' => 'Active',
        'inactive' => 'Inactive',
        'under_construction' => 'Under Construction',
    ],

    // === Prediction ===
    'prediction_status' => [
        'pending' => 'Processing',
        'completed' => 'Completed',
        'failed' => 'Failed',
    ],

    // === Recommendation ===
    'recommendation_type' => [
        'reroute' => 'Reroute',
        'signal_change' => 'Signal Change',
        'speed_limit' => 'Speed Limit',
        'lane_control' => 'Lane Control',
        'advisory' => 'Advisory',
    ],
    'recommendation_status' => [
        'pending' => 'Pending',
        'approved' => 'Approved',
        'rejected' => 'Rejected',
        'executed' => 'Executed',
    ],

    // === General Statuses ===
    'status' => [
        'active' => 'Active',
        'inactive' => 'Inactive',
    ],
];

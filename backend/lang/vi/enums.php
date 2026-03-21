<?php

return [
    // === User Roles ===
    'roles' => [
        'super_admin' => 'Quản trị viên cao cấp',
        'city_admin' => 'Quản trị viên thành phố',
        'traffic_operator' => 'Điều hành giao thông',
        'urban_planner' => 'Quy hoạch đô thị',
        'emergency' => 'Dịch vụ khẩn cấp',
        'citizen' => 'Công dân',
    ],

    // === Incident ===
    'incident_type' => [
        'accident' => 'Tai nạn',
        'congestion' => 'Ùn tắc',
        'construction' => 'Thi công',
        'weather' => 'Thời tiết',
        'other' => 'Khác',
    ],
    'incident_severity' => [
        'low' => 'Thấp',
        'medium' => 'Trung bình',
        'high' => 'Cao',
        'critical' => 'Nghiêm trọng',
    ],
    'incident_status' => [
        'open' => 'Đang mở',
        'investigating' => 'Đang điều tra',
        'resolved' => 'Đã giải quyết',
        'closed' => 'Đã đóng',
    ],
    'incident_source' => [
        'operator' => 'Điều hành viên',
        'citizen' => 'Công dân',
        'auto_detected' => 'Tự động phát hiện',
    ],

    // === Edge (Road Segment) ===
    'congestion_level' => [
        'none' => 'Thông thoáng',
        'light' => 'Nhẹ',
        'moderate' => 'Vừa phải',
        'heavy' => 'Nặng',
        'severe' => 'Nghiêm trọng',
    ],
    'direction' => [
        'one_way' => 'Một chiều',
        'two_way' => 'Hai chiều',
    ],
    'road_type' => [
        'highway' => 'Đường cao tốc',
        'arterial' => 'Đường chính',
        'collector' => 'Đường gom',
        'local' => 'Đường nội bộ',
        'residential' => 'Đường dân sinh',
        'urban' => 'Đường đô thị',
        'bridge' => 'Cầu',
    ],

    // === Sensor ===
    'sensor_type' => [
        'camera' => 'Camera',
        'loop_detector' => 'Vòng từ',
        'radar' => 'Radar',
        'weather' => 'Thời tiết',
        'camera_feed' => 'Camera giám sát',
        'traffic_counter' => 'Bộ đếm xe',
        'weather_station' => 'Trạm thời tiết',
    ],
    'sensor_status' => [
        'active' => 'Hoạt động',
        'maintenance' => 'Bảo trì',
        'offline' => 'Ngoại tuyến',
        'online' => 'Trực tuyến',
    ],

    // === Node ===
    'node_type' => [
        'intersection' => 'Ngã tư',
        'roundabout' => 'Vòng xoay',
        'terminal' => 'Điểm cuối',
        'merge' => 'Điểm hợp nhất',
        'bridge' => 'Cầu',
        'landmark' => 'Địa danh',
    ],
    'node_status' => [
        'active' => 'Hoạt động',
        'inactive' => 'Không hoạt động',
        'under_construction' => 'Đang thi công',
    ],

    // === Prediction ===
    'prediction_status' => [
        'pending' => 'Đang xử lý',
        'completed' => 'Hoàn thành',
        'failed' => 'Thất bại',
    ],

    // === Recommendation ===
    'recommendation_type' => [
        'reroute' => 'Chuyển hướng',
        'signal_change' => 'Thay đổi đèn tín hiệu',
        'speed_limit' => 'Giới hạn tốc độ',
        'lane_control' => 'Kiểm soát làn đường',
        'advisory' => 'Khuyến cáo',
    ],
    'recommendation_status' => [
        'pending' => 'Chờ duyệt',
        'approved' => 'Đã duyệt',
        'rejected' => 'Đã từ chối',
        'executed' => 'Đã thực hiện',
    ],

    // === General Statuses ===
    'status' => [
        'active' => 'Hoạt động',
        'inactive' => 'Không hoạt động',
    ],
];

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GraphSeeder extends Seeder
{
    public function run(): void
    {
        // ==========================================
        // ZONES — Các quận chính của Đà Nẵng
        // ==========================================
        DB::statement("
            INSERT INTO zones (name, code, type, boundary, created_at, updated_at) VALUES
            ('Quận Hải Châu', 'HC', 'district', ST_GeomFromText('POLYGON((108.20 16.05, 108.23 16.05, 108.23 16.08, 108.20 16.08, 108.20 16.05))', 4326), NOW(), NOW()),
            ('Quận Thanh Khê', 'TK', 'district', ST_GeomFromText('POLYGON((108.17 16.06, 108.20 16.06, 108.20 16.09, 108.17 16.09, 108.17 16.06))', 4326), NOW(), NOW()),
            ('Quận Sơn Trà', 'ST', 'district', ST_GeomFromText('POLYGON((108.22 16.06, 108.26 16.06, 108.26 16.10, 108.22 16.10, 108.22 16.06))', 4326), NOW(), NOW()),
            ('Quận Ngũ Hành Sơn', 'NHS', 'district', ST_GeomFromText('POLYGON((108.23 16.01, 108.26 16.01, 108.26 16.05, 108.23 16.05, 108.23 16.01))', 4326), NOW(), NOW()),
            ('Quận Liên Chiểu', 'LC', 'district', ST_GeomFromText('POLYGON((108.13 16.06, 108.17 16.06, 108.17 16.10, 108.13 16.10, 108.13 16.06))', 4326), NOW(), NOW()),
            ('Quận Cẩm Lệ', 'CL', 'district', ST_GeomFromText('POLYGON((108.19 16.01, 108.22 16.01, 108.22 16.05, 108.19 16.05, 108.19 16.01))', 4326), NOW(), NOW())
        ");

        // ==========================================
        // NODES — 20 giao lộ/cầu/landmark chính tại Đà Nẵng
        // ==========================================
        DB::statement("
            INSERT INTO nodes (name, type, location, zone_id, has_traffic_light, status, created_at, updated_at) VALUES
            ('Ngã tư Điện Biên Phủ - Lê Duẩn', 'intersection', ST_SetSRID(ST_Point(108.2122, 16.0680), 4326), 1, true, 'active', NOW(), NOW()),
            ('Ngã tư Nguyễn Văn Linh - Điện Biên Phủ', 'intersection', ST_SetSRID(ST_Point(108.2200, 16.0650), 4326), 1, true, 'active', NOW(), NOW()),
            ('Cầu Rồng (đầu Hải Châu)', 'bridge', ST_SetSRID(ST_Point(108.2270, 16.0620), 4326), 1, false, 'active', NOW(), NOW()),
            ('Cầu Rồng (đầu Sơn Trà)', 'bridge', ST_SetSRID(ST_Point(108.2320, 16.0630), 4326), 3, false, 'active', NOW(), NOW()),
            ('Ngã tư Trần Phú - Lê Duẩn', 'intersection', ST_SetSRID(ST_Point(108.2100, 16.0720), 4326), 1, true, 'active', NOW(), NOW()),
            ('Vòng xoay Nguyễn Tri Phương', 'roundabout', ST_SetSRID(ST_Point(108.1950, 16.0720), 4326), 2, true, 'active', NOW(), NOW()),
            ('Ngã tư Ông Ích Khiêm - Trần Cao Vân', 'intersection', ST_SetSRID(ST_Point(108.2050, 16.0680), 4326), 1, true, 'active', NOW(), NOW()),
            ('Cầu Sông Hàn (đầu Hải Châu)', 'bridge', ST_SetSRID(ST_Point(108.2240, 16.0710), 4326), 1, false, 'active', NOW(), NOW()),
            ('Cầu Sông Hàn (đầu Sơn Trà)', 'bridge', ST_SetSRID(ST_Point(108.2280, 16.0720), 4326), 3, false, 'active', NOW(), NOW()),
            ('Ngã tư Phạm Văn Đồng - Nguyễn Tri Phương', 'intersection', ST_SetSRID(ST_Point(108.1920, 16.0790), 4326), 2, true, 'active', NOW(), NOW()),
            ('Ngã tư Ngũ Hành Sơn - Lê Văn Hiến', 'intersection', ST_SetSRID(ST_Point(108.2450, 16.0350), 4326), 4, true, 'active', NOW(), NOW()),
            ('Bãi biển Mỹ Khê (trước APEC Park)', 'landmark', ST_SetSRID(ST_Point(108.2480, 16.0550), 4326), 3, false, 'active', NOW(), NOW()),
            ('Cầu Thuận Phước (đầu HC)', 'bridge', ST_SetSRID(ST_Point(108.2170, 16.0870), 4326), 1, false, 'active', NOW(), NOW()),
            ('Cầu Thuận Phước (đầu ST)', 'bridge', ST_SetSRID(ST_Point(108.2230, 16.0900), 4326), 3, false, 'active', NOW(), NOW()),
            ('Sân bay Đà Nẵng', 'landmark', ST_SetSRID(ST_Point(108.1993, 16.0559), 4326), 2, false, 'active', NOW(), NOW()),
            ('Ngã ba Huế', 'intersection', ST_SetSRID(ST_Point(108.1850, 16.0730), 4326), 2, true, 'active', NOW(), NOW()),
            ('Ngã tư Lê Đình Lý - Nguyễn Văn Linh', 'intersection', ST_SetSRID(ST_Point(108.2150, 16.0590), 4326), 1, true, 'active', NOW(), NOW()),
            ('Ngã tư Hoàng Diệu - Trưng Nữ Vương', 'intersection', ST_SetSRID(ST_Point(108.2180, 16.0650), 4326), 1, true, 'active', NOW(), NOW()),
            ('Cầu Trần Thị Lý', 'bridge', ST_SetSRID(ST_Point(108.2290, 16.0560), 4326), 1, false, 'active', NOW(), NOW()),
            ('Ngã tư Võ Văn Kiệt - Nguyễn Tri Phương', 'intersection', ST_SetSRID(ST_Point(108.1880, 16.0810), 4326), 5, true, 'active', NOW(), NOW())
        ");

        // ==========================================
        // EDGES — 25 đoạn đường kết nối (topology Đà Nẵng)
        // ==========================================
        DB::statement("
            INSERT INTO edges (name, source_node_id, target_node_id, geometry, length_m, lanes, speed_limit_kmh, direction, road_type, current_density, congestion_level, status, created_at, updated_at) VALUES
            ('Lê Duẩn (TP→ĐBP)', 5, 1, ST_MakeLine(ST_SetSRID(ST_Point(108.2100, 16.0720), 4326), ST_SetSRID(ST_Point(108.2122, 16.0680), 4326)), 500, 3, 50, 'two_way', 'urban', 0.45, 'light', 'normal', NOW(), NOW()),
            ('Điện Biên Phủ (ĐBP→NVL)', 1, 2, ST_MakeLine(ST_SetSRID(ST_Point(108.2122, 16.0680), 4326), ST_SetSRID(ST_Point(108.2200, 16.0650), 4326)), 850, 3, 50, 'two_way', 'urban', 0.62, 'moderate', 'normal', NOW(), NOW()),
            ('Nguyễn Văn Linh (NVL→Cầu Rồng)', 2, 3, ST_MakeLine(ST_SetSRID(ST_Point(108.2200, 16.0650), 4326), ST_SetSRID(ST_Point(108.2270, 16.0620), 4326)), 780, 4, 60, 'two_way', 'highway', 0.78, 'heavy', 'congested', NOW(), NOW()),
            ('Cầu Rồng', 3, 4, ST_MakeLine(ST_SetSRID(ST_Point(108.2270, 16.0620), 4326), ST_SetSRID(ST_Point(108.2320, 16.0630), 4326)), 666, 6, 60, 'two_way', 'bridge', 0.55, 'moderate', 'normal', NOW(), NOW()),
            ('Trần Phú (TP→OIK)', 5, 7, ST_MakeLine(ST_SetSRID(ST_Point(108.2100, 16.0720), 4326), ST_SetSRID(ST_Point(108.2050, 16.0680), 4326)), 650, 2, 40, 'two_way', 'urban', 0.35, 'light', 'normal', NOW(), NOW()),
            ('Ông Ích Khiêm (OIK→VX NTP)', 7, 6, ST_MakeLine(ST_SetSRID(ST_Point(108.2050, 16.0680), 4326), ST_SetSRID(ST_Point(108.1950, 16.0720), 4326)), 1100, 2, 40, 'two_way', 'urban', 0.42, 'light', 'normal', NOW(), NOW()),
            ('Lê Duẩn (TP→Cầu SH)', 5, 8, ST_MakeLine(ST_SetSRID(ST_Point(108.2100, 16.0720), 4326), ST_SetSRID(ST_Point(108.2240, 16.0710), 4326)), 1500, 3, 50, 'two_way', 'urban', 0.68, 'moderate', 'normal', NOW(), NOW()),
            ('Cầu Sông Hàn', 8, 9, ST_MakeLine(ST_SetSRID(ST_Point(108.2240, 16.0710), 4326), ST_SetSRID(ST_Point(108.2280, 16.0720), 4326)), 487, 4, 50, 'two_way', 'bridge', 0.72, 'heavy', 'normal', NOW(), NOW()),
            ('Nguyễn Tri Phương (VX→PVĐ)', 6, 10, ST_MakeLine(ST_SetSRID(ST_Point(108.1950, 16.0720), 4326), ST_SetSRID(ST_Point(108.1920, 16.0790), 4326)), 800, 3, 50, 'two_way', 'urban', 0.30, 'light', 'normal', NOW(), NOW()),
            ('Phạm Văn Đồng (PVĐ→Ngã ba Huế)', 10, 16, ST_MakeLine(ST_SetSRID(ST_Point(108.1920, 16.0790), 4326), ST_SetSRID(ST_Point(108.1850, 16.0730), 4326)), 900, 4, 60, 'two_way', 'highway', 0.50, 'moderate', 'normal', NOW(), NOW()),
            ('Cầu Thuận Phước', 13, 14, ST_MakeLine(ST_SetSRID(ST_Point(108.2170, 16.0870), 4326), ST_SetSRID(ST_Point(108.2230, 16.0900), 4326)), 1851, 4, 60, 'two_way', 'bridge', 0.25, 'none', 'normal', NOW(), NOW()),
            ('Nguyễn Văn Linh (NVL→LĐL)', 2, 17, ST_MakeLine(ST_SetSRID(ST_Point(108.2200, 16.0650), 4326), ST_SetSRID(ST_Point(108.2150, 16.0590), 4326)), 750, 4, 60, 'two_way', 'highway', 0.58, 'moderate', 'normal', NOW(), NOW()),
            ('Hoàng Diệu (HĐ→ĐBP)', 18, 1, ST_MakeLine(ST_SetSRID(ST_Point(108.2180, 16.0650), 4326), ST_SetSRID(ST_Point(108.2122, 16.0680), 4326)), 700, 2, 40, 'two_way', 'urban', 0.38, 'light', 'normal', NOW(), NOW()),
            ('Nguyễn Văn Linh (LĐL→Sân bay)', 17, 15, ST_MakeLine(ST_SetSRID(ST_Point(108.2150, 16.0590), 4326), ST_SetSRID(ST_Point(108.1993, 16.0559), 4326)), 1700, 4, 60, 'two_way', 'highway', 0.65, 'moderate', 'normal', NOW(), NOW()),
            ('Cầu Trần Thị Lý (đi NHS)', 19, 11, ST_MakeLine(ST_SetSRID(ST_Point(108.2290, 16.0560), 4326), ST_SetSRID(ST_Point(108.2450, 16.0350), 4326)), 2800, 4, 60, 'two_way', 'bridge', 0.40, 'light', 'normal', NOW(), NOW()),
            ('Điện Biên Phủ (ĐBP→LĐL)', 1, 17, ST_MakeLine(ST_SetSRID(ST_Point(108.2122, 16.0680), 4326), ST_SetSRID(ST_Point(108.2150, 16.0590), 4326)), 1000, 3, 50, 'two_way', 'urban', 0.48, 'light', 'normal', NOW(), NOW()),
            ('Bạch Đằng Đông (Cầu Rồng→MK)', 4, 12, ST_MakeLine(ST_SetSRID(ST_Point(108.2320, 16.0630), 4326), ST_SetSRID(ST_Point(108.2480, 16.0550), 4326)), 1900, 3, 50, 'two_way', 'urban', 0.82, 'heavy', 'congested', NOW(), NOW()),
            ('Võ Văn Kiệt (VVK→NTP)', 20, 10, ST_MakeLine(ST_SetSRID(ST_Point(108.1880, 16.0810), 4326), ST_SetSRID(ST_Point(108.1920, 16.0790), 4326)), 470, 3, 50, 'two_way', 'urban', 0.20, 'none', 'normal', NOW(), NOW()),
            ('Võ Văn Kiệt (VVK→Ngã ba Huế)', 20, 16, ST_MakeLine(ST_SetSRID(ST_Point(108.1880, 16.0810), 4326), ST_SetSRID(ST_Point(108.1850, 16.0730), 4326)), 950, 3, 50, 'two_way', 'urban', 0.33, 'light', 'normal', NOW(), NOW()),
            ('Lê Văn Hiến (NHS)', 11, 12, ST_MakeLine(ST_SetSRID(ST_Point(108.2450, 16.0350), 4326), ST_SetSRID(ST_Point(108.2480, 16.0550), 4326)), 2200, 3, 50, 'two_way', 'urban', 0.52, 'moderate', 'normal', NOW(), NOW()),
            ('Ngã ba Huế → Sân bay', 16, 15, ST_MakeLine(ST_SetSRID(ST_Point(108.1850, 16.0730), 4326), ST_SetSRID(ST_Point(108.1993, 16.0559), 4326)), 2200, 4, 60, 'two_way', 'highway', 0.44, 'light', 'normal', NOW(), NOW()),
            ('Trưng Nữ Vương (HĐ→OIK)', 18, 7, ST_MakeLine(ST_SetSRID(ST_Point(108.2180, 16.0650), 4326), ST_SetSRID(ST_Point(108.2050, 16.0680), 4326)), 1400, 2, 40, 'two_way', 'urban', 0.28, 'none', 'normal', NOW(), NOW()),
            ('Nguyễn Văn Linh (NVL→HĐ)', 2, 18, ST_MakeLine(ST_SetSRID(ST_Point(108.2200, 16.0650), 4326), ST_SetSRID(ST_Point(108.2180, 16.0650), 4326)), 200, 4, 60, 'two_way', 'highway', 0.60, 'moderate', 'normal', NOW(), NOW()),
            ('Hoàng Diệu (HĐ→Cầu TTL)', 18, 19, ST_MakeLine(ST_SetSRID(ST_Point(108.2180, 16.0650), 4326), ST_SetSRID(ST_Point(108.2290, 16.0560), 4326)), 1400, 3, 50, 'two_way', 'urban', 0.47, 'light', 'normal', NOW(), NOW()),
            ('Nguyễn Tri Phương (VX→Cầu TP)', 6, 13, ST_MakeLine(ST_SetSRID(ST_Point(108.1950, 16.0720), 4326), ST_SetSRID(ST_Point(108.2170, 16.0870), 4326)), 2700, 3, 50, 'two_way', 'urban', 0.36, 'light', 'normal', NOW(), NOW())
        ");

        // ==========================================
        // SENSORS — 12 IoT sensors tại các điểm quan trọng
        // ==========================================
        DB::statement("
            INSERT INTO sensors (sensor_code, edge_id, type, model, status, metadata, created_at, updated_at) VALUES
            ('SENSOR-CR-001', 3, 'traffic_counter', 'DS-2CD2T45', 'online', '{\"manufacturer\": \"Hikvision\"}', NOW(), NOW()),
            ('SENSOR-CR-002', 3, 'camera_feed', 'DS-2CD2T45', 'online', '{\"manufacturer\": \"Hikvision\", \"resolution\": \"4K\"}', NOW(), NOW()),
            ('SENSOR-CSH-001', 8, 'traffic_counter', 'P1445-LE', 'online', '{\"manufacturer\": \"Axis\"}', NOW(), NOW()),
            ('SENSOR-DBP-001', 2, 'traffic_counter', 'DS-2CD2T45', 'online', '{\"manufacturer\": \"Hikvision\"}', NOW(), NOW()),
            ('SENSOR-NVL-001', 12, 'camera_feed', 'IPC-HFW2431T', 'online', '{\"manufacturer\": \"Dahua\", \"resolution\": \"2K\"}', NOW(), NOW()),
            ('SENSOR-MK-001', 17, 'weather_station', 'Vantage Pro2', 'online', '{\"manufacturer\": \"Davis\"}', NOW(), NOW()),
            ('SENSOR-SB-001', 14, 'traffic_counter', 'DS-2CD2T45', 'online', '{\"manufacturer\": \"Hikvision\"}', NOW(), NOW()),
            ('SENSOR-TP-001', 11, 'camera_feed', 'P1445-LE', 'online', '{\"manufacturer\": \"Axis\"}', NOW(), NOW()),
            ('SENSOR-NTP-001', 9, 'traffic_counter', 'DS-2CD2T45', 'online', '{\"manufacturer\": \"Hikvision\"}', NOW(), NOW()),
            ('SENSOR-NHS-001', 15, 'weather_station', 'Vantage Pro2', 'online', '{\"manufacturer\": \"Davis\"}', NOW(), NOW()),
            ('SENSOR-PVD-001', 10, 'traffic_counter', 'P1445-LE', 'offline', '{\"manufacturer\": \"Axis\", \"error\": \"Connection timeout\"}', NOW(), NOW()),
            ('SENSOR-NBH-001', 19, 'traffic_counter', 'DS-2CD2T45', 'online', '{\"manufacturer\": \"Hikvision\"}', NOW(), NOW())
        ");
    }
}

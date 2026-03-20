<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GraphSeeder extends Seeder
{
    public function run(): void
    {
        // Zone: Quận 1 (simplified polygon)
        DB::statement("
            INSERT INTO zones (name, code, type, boundary, created_at, updated_at) VALUES
            ('Quận 1', 'Q1', 'district', ST_GeomFromText('POLYGON((106.68 10.76, 106.71 10.76, 106.71 10.79, 106.68 10.79, 106.68 10.76))', 4326), NOW(), NOW()),
            ('Quận 3', 'Q3', 'district', ST_GeomFromText('POLYGON((106.67 10.77, 106.70 10.77, 106.70 10.80, 106.67 10.80, 106.67 10.77))', 4326), NOW(), NOW()),
            ('Quận Bình Thạnh', 'QBT', 'district', ST_GeomFromText('POLYGON((106.69 10.79, 106.72 10.79, 106.72 10.82, 106.69 10.82, 106.69 10.79))', 4326), NOW(), NOW())
        ");

        // 10 Nodes (intersections in HCMC area)
        DB::statement("
            INSERT INTO nodes (name, type, location, zone_id, has_traffic_light, status, created_at, updated_at) VALUES
            ('Ngã tư Phạm Ngọc Thạch - Điện Biên Phủ', 'intersection', ST_SetSRID(ST_Point(106.6950, 10.7810), 4326), 1, true, 'active', NOW(), NOW()),
            ('Ngã tư Hai Bà Trưng - Điện Biên Phủ', 'intersection', ST_SetSRID(ST_Point(106.6980, 10.7800), 4326), 1, true, 'active', NOW(), NOW()),
            ('Ngã tư Cách Mạng Tháng Tám - Điện Biên Phủ', 'intersection', ST_SetSRID(ST_Point(106.6880, 10.7830), 4326), 2, true, 'active', NOW(), NOW()),
            ('Ngã tư Hàng Xanh', 'roundabout', ST_SetSRID(ST_Point(106.7030, 10.7970), 4326), 3, true, 'active', NOW(), NOW()),
            ('Ngã tư Nguyễn Hữu Cảnh - Tôn Đức Thắng', 'intersection', ST_SetSRID(ST_Point(106.7050, 10.7850), 4326), 1, true, 'active', NOW(), NOW()),
            ('Ngã tư Võ Văn Tần - Cách Mạng Tháng Tám', 'intersection', ST_SetSRID(ST_Point(106.6870, 10.7760), 4326), 2, true, 'active', NOW(), NOW()),
            ('Ngã tư Xô Viết Nghệ Tĩnh - Điện Biên Phủ', 'intersection', ST_SetSRID(ST_Point(106.7010, 10.7920), 4326), 3, true, 'active', NOW(), NOW()),
            ('Vòng xoay Dân Chủ', 'roundabout', ST_SetSRID(ST_Point(106.6860, 10.7735), 4326), 2, true, 'active', NOW(), NOW()),
            ('Cầu Sài Gòn (đầu Q2)', 'bridge', ST_SetSRID(ST_Point(106.7200, 10.7990), 4326), 3, false, 'active', NOW(), NOW()),
            ('Ngã tư Đinh Tiên Hoàng - Điện Biên Phủ', 'intersection', ST_SetSRID(ST_Point(106.6930, 10.7820), 4326), 1, true, 'active', NOW(), NOW())
        ");

        // 15 Edges (roads connecting nodes)
        DB::statement("
            INSERT INTO edges (name, source_node_id, target_node_id, geometry, length_m, lanes, speed_limit_kmh, direction, road_type, current_density, congestion_level, status, created_at, updated_at) VALUES
            ('Điện Biên Phủ (PNT→HBT)', 1, 2, ST_MakeLine(ST_SetSRID(ST_Point(106.6950, 10.7810), 4326), ST_SetSRID(ST_Point(106.6980, 10.7800), 4326)), 350, 3, 50, 'two_way', 'urban', 0.45, 'light', 'normal', NOW(), NOW()),
            ('Điện Biên Phủ (CMT8→PNT)', 3, 1, ST_MakeLine(ST_SetSRID(ST_Point(106.6880, 10.7830), 4326), ST_SetSRID(ST_Point(106.6950, 10.7810), 4326)), 820, 3, 50, 'two_way', 'urban', 0.62, 'moderate', 'normal', NOW(), NOW()),
            ('Điện Biên Phủ (HBT→XVNT)', 2, 7, ST_MakeLine(ST_SetSRID(ST_Point(106.6980, 10.7800), 4326), ST_SetSRID(ST_Point(106.7010, 10.7920), 4326)), 1400, 3, 50, 'two_way', 'urban', 0.35, 'light', 'normal', NOW(), NOW()),
            ('Điện Biên Phủ (XVNT→HX)', 7, 4, ST_MakeLine(ST_SetSRID(ST_Point(106.7010, 10.7920), 4326), ST_SetSRID(ST_Point(106.7030, 10.7970), 4326)), 600, 3, 50, 'two_way', 'urban', 0.78, 'heavy', 'congested', NOW(), NOW()),
            ('Xô Viết Nghệ Tĩnh (XVNT→HX)', 7, 4, ST_MakeLine(ST_SetSRID(ST_Point(106.7010, 10.7920), 4326), ST_SetSRID(ST_Point(106.7030, 10.7970), 4326)), 550, 2, 40, 'one_way', 'urban', 0.55, 'moderate', 'normal', NOW(), NOW()),
            ('Nguyễn Hữu Cảnh (NHC→HX)', 5, 4, ST_MakeLine(ST_SetSRID(ST_Point(106.7050, 10.7850), 4326), ST_SetSRID(ST_Point(106.7030, 10.7970), 4326)), 1400, 3, 60, 'two_way', 'urban', 0.82, 'heavy', 'congested', NOW(), NOW()),
            ('Hai Bà Trưng (HBT→NHC)', 2, 5, ST_MakeLine(ST_SetSRID(ST_Point(106.6980, 10.7800), 4326), ST_SetSRID(ST_Point(106.7050, 10.7850), 4326)), 900, 2, 40, 'two_way', 'urban', 0.28, 'none', 'normal', NOW(), NOW()),
            ('Cách Mạng Tháng Tám (CMT8→VXD)', 3, 8, ST_MakeLine(ST_SetSRID(ST_Point(106.6880, 10.7830), 4326), ST_SetSRID(ST_Point(106.6860, 10.7735), 4326)), 1100, 4, 50, 'two_way', 'urban', 0.40, 'light', 'normal', NOW(), NOW()),
            ('Cách Mạng Tháng Tám (VXD→VVT)', 8, 6, ST_MakeLine(ST_SetSRID(ST_Point(106.6860, 10.7735), 4326), ST_SetSRID(ST_Point(106.6870, 10.7760), 4326)), 300, 4, 50, 'two_way', 'urban', 0.20, 'none', 'normal', NOW(), NOW()),
            ('Võ Văn Tần (VVT→PNT)', 6, 1, ST_MakeLine(ST_SetSRID(ST_Point(106.6870, 10.7760), 4326), ST_SetSRID(ST_Point(106.6950, 10.7810), 4326)), 1000, 2, 40, 'one_way', 'urban', 0.50, 'moderate', 'normal', NOW(), NOW()),
            ('Phạm Ngọc Thạch (PNT→ĐTH)', 1, 10, ST_MakeLine(ST_SetSRID(ST_Point(106.6950, 10.7810), 4326), ST_SetSRID(ST_Point(106.6930, 10.7820), 4326)), 250, 2, 40, 'two_way', 'urban', 0.32, 'light', 'normal', NOW(), NOW()),
            ('Đinh Tiên Hoàng (ĐTH→HBT)', 10, 2, ST_MakeLine(ST_SetSRID(ST_Point(106.6930, 10.7820), 4326), ST_SetSRID(ST_Point(106.6980, 10.7800), 4326)), 580, 2, 40, 'two_way', 'urban', 0.15, 'none', 'normal', NOW(), NOW()),
            ('Hàng Xanh → Cầu SG', 4, 9, ST_MakeLine(ST_SetSRID(ST_Point(106.7030, 10.7970), 4326), ST_SetSRID(ST_Point(106.7200, 10.7990), 4326)), 1900, 4, 60, 'two_way', 'highway', 0.70, 'moderate', 'normal', NOW(), NOW()),
            ('Điện Biên Phủ (ĐTH→PNT) ngược', 10, 1, ST_MakeLine(ST_SetSRID(ST_Point(106.6930, 10.7820), 4326), ST_SetSRID(ST_Point(106.6950, 10.7810), 4326)), 250, 2, 40, 'two_way', 'urban', 0.38, 'light', 'normal', NOW(), NOW()),
            ('Nguyễn Hữu Cảnh (NHC→HBT)', 5, 2, ST_MakeLine(ST_SetSRID(ST_Point(106.7050, 10.7850), 4326), ST_SetSRID(ST_Point(106.6980, 10.7800), 4326)), 900, 3, 50, 'two_way', 'urban', 0.42, 'light', 'normal', NOW(), NOW())
        ");
    }
}

<?php

namespace Database\Seeders;

use App\Models\Incident;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IncidentSeeder extends Seeder
{
    public function run(): void
    {
        $isPostgres = DB::connection()->getDriverName() === 'pgsql';

        $incidents = [
            // ===== ACCIDENT (5) =====
            [
                'title' => 'Va chạm xe Container trên Cầu Rồng',
                'description' => 'Hai xe container va chạm gây ùn tắc nghiêm trọng trên Cầu Rồng hướng Sơn Trà. Một làn đường bị chặn.',
                'type' => 'accident', 'severity' => 'critical', 'status' => 'investigating',
                'source' => 'operator', 'reported_by' => 3, 'assigned_to' => 3,
                'lat' => 16.0625, 'lng' => 108.2295,
            ],
            [
                'title' => 'Xe buýt đâm dải phân cách trên Nguyễn Văn Linh',
                'description' => 'Xe buýt tuyến R14 mất lái đâm vào dải phân cách. 3 hành khách bị thương nhẹ.',
                'type' => 'accident', 'severity' => 'high', 'status' => 'investigating',
                'source' => 'citizen', 'reported_by' => 7, 'assigned_to' => 3,
                'lat' => 16.0640, 'lng' => 108.2180,
            ],
            [
                'title' => 'Tai nạn xe máy gần Ngã ba Huế',
                'description' => 'Va chạm giữa 2 xe máy tại ngã ba Huế. Giao thông bị chậm nhẹ.',
                'type' => 'accident', 'severity' => 'medium', 'status' => 'resolved',
                'source' => 'auto_detected', 'reported_by' => 3, 'assigned_to' => 4,
                'lat' => 16.0730, 'lng' => 108.1850, 'resolved_at' => now()->subHours(2),
            ],
            [
                'title' => 'Lật xe tải trên đường Phạm Văn Đồng',
                'description' => 'Xe tải chở vật liệu xây dựng bị lật tại khúc cua. Hàng hóa tràn ra đường.',
                'type' => 'accident', 'severity' => 'high', 'status' => 'open',
                'source' => 'citizen', 'reported_by' => 8, 'assigned_to' => null,
                'lat' => 16.0790, 'lng' => 108.1920,
            ],
            [
                'title' => 'Va chạm 3 ô tô trước sân bay Đà Nẵng',
                'description' => 'Tai nạn liên hoàn 3 xe ô tô tại đường dẫn vào sân bay. Kẹt xe kéo dài 1.5km.',
                'type' => 'accident', 'severity' => 'critical', 'status' => 'open',
                'source' => 'operator', 'reported_by' => 3, 'assigned_to' => 3,
                'lat' => 16.0559, 'lng' => 108.1993,
            ],

            // ===== CONGESTION (4) =====
            [
                'title' => 'Ùn tắc giờ cao điểm khu vực Cầu Sông Hàn',
                'description' => 'Mật độ phương tiện cực cao vào giờ tan tầm 17h-18h. Cầu Sông Hàn ùn tắc kéo dài.',
                'type' => 'congestion', 'severity' => 'high', 'status' => 'investigating',
                'source' => 'auto_detected', 'reported_by' => 3, 'assigned_to' => 4,
                'lat' => 16.0710, 'lng' => 108.2240,
            ],
            [
                'title' => 'Kẹt xe khu du lịch Mỹ Khê cuối tuần',
                'description' => 'Lượng du khách đổ về bãi biển Mỹ Khê gây kẹt xe trên đường Võ Nguyên Giáp.',
                'type' => 'congestion', 'severity' => 'medium', 'status' => 'open',
                'source' => 'citizen', 'reported_by' => 7, 'assigned_to' => null,
                'lat' => 16.0550, 'lng' => 108.2480,
            ],
            [
                'title' => 'Ùn tắc đoạn Bạch Đằng Đông chiều Sơn Trà → Hải Châu',
                'description' => 'Mật độ vehicle density đạt 0.85 trên đoạn Bạch Đằng Đông. AI đề xuất reroute.',
                'type' => 'congestion', 'severity' => 'high', 'status' => 'investigating',
                'source' => 'auto_detected', 'reported_by' => 3, 'assigned_to' => 3,
                'lat' => 16.0600, 'lng' => 108.2380,
            ],
            [
                'title' => 'Tắc đường Lê Duẩn giờ đi làm sáng',
                'description' => 'Đoạn từ ngã tư Trần Phú đến Cầu Sông Hàn bị kẹt nhẹ 7h-8h.',
                'type' => 'congestion', 'severity' => 'low', 'status' => 'resolved',
                'source' => 'auto_detected', 'reported_by' => 3, 'assigned_to' => 4,
                'lat' => 16.0720, 'lng' => 108.2150, 'resolved_at' => now()->subHours(5),
            ],

            // ===== WEATHER (3) =====
            [
                'title' => 'Ngập nước đường Nguyễn Hữu Thọ sau mưa lớn',
                'description' => 'Mưa lớn kéo dài 3 tiếng gây ngập 30cm trên đường Nguyễn Hữu Thọ (Cẩm Lệ). Nhiều xe chết máy.',
                'type' => 'weather', 'severity' => 'critical', 'status' => 'open',
                'source' => 'citizen', 'reported_by' => 8, 'assigned_to' => 3,
                'lat' => 16.0300, 'lng' => 108.2100,
            ],
            [
                'title' => 'Cây đổ chắn đường Trần Cao Vân',
                'description' => 'Gió mạnh làm đổ cây lớn trên đường Trần Cao Vân, chặn 2 làn xe.',
                'type' => 'weather', 'severity' => 'high', 'status' => 'investigating',
                'source' => 'operator', 'reported_by' => 4, 'assigned_to' => 4,
                'lat' => 16.0680, 'lng' => 108.2050,
            ],
            [
                'title' => 'Sương mù dày đặc khu vực Cầu Thuận Phước',
                'description' => 'Tầm nhìn giảm xuống dưới 50m trên Cầu Thuận Phước. Cảnh báo giảm tốc độ.',
                'type' => 'weather', 'severity' => 'medium', 'status' => 'resolved',
                'source' => 'auto_detected', 'reported_by' => 3, 'assigned_to' => null,
                'lat' => 16.0885, 'lng' => 108.2200, 'resolved_at' => now()->subHours(8),
            ],

            // ===== CONSTRUCTION (3) =====
            [
                'title' => 'Thi công cải tạo mặt đường Điện Biên Phủ',
                'description' => 'UBND quận Hải Châu thi công nâng cấp mặt đường ĐBP đoạn từ Lê Duẩn đến NVL. Dự kiến 15 ngày.',
                'type' => 'construction', 'severity' => 'medium', 'status' => 'open',
                'source' => 'operator', 'reported_by' => 3, 'assigned_to' => 3,
                'lat' => 16.0665, 'lng' => 108.2160,
            ],
            [
                'title' => 'Lắp đặt hệ thống thoát nước đường 2/9',
                'description' => 'Đào đường lắp cống thoát nước mới trên đường 2 Tháng 9. Thu hẹp 1 làn xe.',
                'type' => 'construction', 'severity' => 'low', 'status' => 'open',
                'source' => 'operator', 'reported_by' => 4, 'assigned_to' => null,
                'lat' => 16.0560, 'lng' => 108.2290,
            ],
            [
                'title' => 'Mở rộng nút giao Nguyễn Tri Phương - Cầu Thuận Phước',
                'description' => 'Dự án mở rộng nút giao phía Tây Cầu Thuận Phước. Đã hoàn thành phase 1.',
                'type' => 'construction', 'severity' => 'low', 'status' => 'resolved',
                'source' => 'operator', 'reported_by' => 3, 'assigned_to' => 3,
                'lat' => 16.0850, 'lng' => 108.2150, 'resolved_at' => now()->subDays(3),
            ],

            // ===== OTHER (3) =====
            [
                'title' => 'Đèn tín hiệu giao thông hư tại Ngã tư Lê Duẩn - ĐBP',
                'description' => 'Đèn đỏ không chuyển sang xanh tại hướng Lê Duẩn → Điện Biên Phủ.',
                'type' => 'other', 'severity' => 'high', 'status' => 'open',
                'source' => 'citizen', 'reported_by' => 7, 'assigned_to' => 3,
                'lat' => 16.0680, 'lng' => 108.2122,
            ],
            [
                'title' => 'Sự kiện marathon quốc tế trên Cầu Rồng',
                'description' => 'Sự kiện Danang International Marathon 2026. Cầu Rồng đóng cửa 6h-12h Chủ nhật.',
                'type' => 'other', 'severity' => 'medium', 'status' => 'resolved',
                'source' => 'operator', 'reported_by' => 3, 'assigned_to' => 4,
                'lat' => 16.0625, 'lng' => 108.2295, 'resolved_at' => now()->subDays(1),
            ],
            [
                'title' => 'CSGT kiểm tra nồng độ cồn trên Trần Phú',
                'description' => 'Lực lượng CSGT lập chốt kiểm tra trên đường Trần Phú. Lưu lượng giảm nhẹ.',
                'type' => 'other', 'severity' => 'low', 'status' => 'resolved',
                'source' => 'auto_detected', 'reported_by' => 3, 'assigned_to' => null,
                'lat' => 16.0700, 'lng' => 108.2080, 'resolved_at' => now()->subHours(12),
            ],
        ];

        foreach ($incidents as $data) {
            $lat = $data['lat'] ?? null;
            $lng = $data['lng'] ?? null;
            $resolvedAt = $data['resolved_at'] ?? null;
            unset($data['lat'], $data['lng'], $data['resolved_at']);

            $incident = Incident::create(array_merge($data, [
                'metadata' => [],
                'resolved_at' => $resolvedAt,
            ]));

            if ($isPostgres && $lat && $lng) {
                DB::statement(
                    'UPDATE incidents SET location = ST_SetSRID(ST_Point(?, ?), 4326) WHERE id = ?',
                    [$lng, $lat, $incident->id]
                );
            }
        }
    }
}

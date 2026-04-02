<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Helpers\ApiResponse;

class ReportController extends Controller
{
    private function mapIncidentToReport($incident)
    {
        $statusToNum = [
            'open' => 0,
            'investigating' => 2,
            'resolved' => 3,
            'closed' => 4,
        ];

        $severityToNum = [
            'low' => 1,
            'medium' => 2,
            'high' => 3,
            'critical' => 4,
        ];
        
        $typeToNum = [
            'accident' => 1,
            'congestion' => 2,
            'construction' => 3,
            'weather' => 4,
            'other' => 6,
        ];

        // Ensure location is parsed if not already
        $lng = null;
        $lat = null;
        if (isset($incident->longitude) && isset($incident->latitude)) {
            $lng = $incident->longitude;
            $lat = $incident->latitude;
        } elseif ($incident->location && is_array($incident->location)) {
            // Depending on ST_X mapping
        }

        return [
            'id' => $incident->id,
            'nguoi_dung_id' => $incident->reported_by,
            'tieu_de' => $incident->title,
            'mo_ta' => $incident->description ?? '',
            'danh_muc_id' => $typeToNum[$incident->type] ?? 6,
            'trang_thai' => $statusToNum[$incident->status] ?? 0,
            'uu_tien_id' => $severityToNum[$incident->severity] ?? 1,
            'kinh_do' => (float) $lng,
            'vi_do' => (float) $lat,
            'dia_chi' => $incident->metadata['address'] ?? 'Không rõ địa chỉ',
            'luot_ung_ho' => $incident->metadata['upvotes'] ?? 0,
            'luot_khong_ung_ho' => $incident->metadata['downvotes'] ?? 0,
            'luot_xem' => $incident->metadata['views'] ?? 0,
            'created_at' => $incident->created_at,
            'updated_at' => $incident->updated_at,
            
            // Nested objects
            'nguoi_dung' => $incident->reporter ? [
                'id' => $incident->reporter->id,
                'ho_ten' => $incident->reporter->name,
                'email' => $incident->reporter->email,
            ] : null,
            
            // Placeholder arrays since we map to simple models
            'hinh_anhs' => collect($incident->metadata['images'] ?? [])->map(function ($img) use ($incident) {
                return [
                    'id' => rand(1000, 9999), 
                    'phan_anh_id' => $incident->id, 
                    'duong_dan_hinh_anh' => is_string($img) ? $img : $img['url']
                ];
            })->toArray(),
            'binh_luans' => []
        ];
    }

    public function index(Request $request)
    {
        $query = Incident::with(['reporter'])
            ->select([
                '*',
                DB::raw('ST_X(location::geometry) as longitude'),
                DB::raw('ST_Y(location::geometry) as latitude'),
            ])
            ->latest();

        $incidents = $query->paginate($request->get('per_page', 15));
        
        $mappedItems = collect($incidents->items())->map(function($incident) {
            return $this->mapIncidentToReport($incident);
        });

        // Re-construct pagination response manually or adjust paginator items
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $mappedItems,
            $incidents->total(),
            $incidents->perPage(),
            $incidents->currentPage(),
            ['path' => \Illuminate\Pagination\Paginator::resolveCurrentPath()]
        );

        return ApiResponse::paginate($paginator, 'api.reports_retrieved');
    }

    public function my(Request $request)
    {
        $query = Incident::with(['reporter'])
            ->select([
                '*',
                DB::raw('ST_X(location::geometry) as longitude'),
                DB::raw('ST_Y(location::geometry) as latitude'),
            ])
            ->where('reported_by', $request->user()->id)
            ->latest();

        $incidents = $query->paginate($request->get('per_page', 15));
        
        $mappedItems = collect($incidents->items())->map(function($incident) {
            return $this->mapIncidentToReport($incident);
        });

        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $mappedItems,
            $incidents->total(),
            $incidents->perPage(),
            $incidents->currentPage(),
            ['path' => \Illuminate\Pagination\Paginator::resolveCurrentPath()]
        );

        return ApiResponse::paginate($paginator, 'api.my_reports_retrieved');
    }

    public function show($id)
    {
        $incident = Incident::with(['reporter'])->select([
                '*',
                DB::raw('ST_X(location::geometry) as longitude'),
                DB::raw('ST_Y(location::geometry) as latitude'),
            ])->findOrFail($id);

        return ApiResponse::success($this->mapIncidentToReport($incident), 'api.report_retrieved');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tieu_de' => 'required|string',
            'mo_ta' => 'required|string',
            'vi_do' => 'required|numeric',
            'kinh_do' => 'required|numeric',
            'dia_chi' => 'required|string',
            'danh_muc' => 'required|numeric',
            'uu_tien' => 'nullable|numeric',
            'media_ids' => 'nullable|array',
        ]);

        $numToType = [
            1 => 'accident',
            2 => 'congestion',
            3 => 'construction',
            4 => 'weather',
            5 => 'weather', // flood
            6 => 'other'
        ];
        
        $numToSeverity = [
            1 => 'low',
            2 => 'medium',
            3 => 'high',
            4 => 'critical',
        ];

        $type = $numToType[$validated['danh_muc']] ?? 'other';
        $severity = trim($request->get('uu_tien', 1));
        $severityStr = $numToSeverity[$severity] ?? 'medium';

        $incident = Incident::create([
            'title' => $validated['tieu_de'],
            'description' => $validated['mo_ta'],
            'type' => $type,
            'severity' => $severityStr,
            'source' => 'citizen',
            'status' => 'open',
            'reported_by' => $request->user()->id,
            'metadata' => [
                'address' => $validated['dia_chi'],
                'images' => [], // We would handle media logic here usually
            ],
        ]);

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement(
                'UPDATE incidents SET location = ST_SetSRID(ST_Point(?, ?), 4326) WHERE id = ?',
                [$validated['kinh_do'], $validated['vi_do'], $incident->id]
            );
        }

        $incident = Incident::with(['reporter'])->select([
            '*',
            DB::raw('ST_X(location::geometry) as longitude'),
            DB::raw('ST_Y(location::geometry) as latitude'),
        ])->findOrFail($incident->id);

        return ApiResponse::created($this->mapIncidentToReport($incident), 'api.report_created');
    }

    public function view($id)
    {
        $incident = Incident::findOrFail($id);
        $meta = $incident->metadata ?? [];
        $meta['views'] = ($meta['views'] ?? 0) + 1;
        $incident->metadata = $meta;
        $incident->save();
        
        return ApiResponse::success(null, 'api.viewed');
    }

    public function stats()
    {
        $stats = [
            'tong_phan_anh' => Incident::count(),
            'da_giai_quyet' => Incident::where('status', 'resolved')->count(),
            'dang_xu_ly' => Incident::whereIn('status', ['open', 'investigating'])->count(),
            'ty_le_giai_quyet' => Incident::count() > 0 
                ? (Incident::where('status', 'resolved')->count() / Incident::count()) * 100 
                : 0,
        ];

        return ApiResponse::success($stats, 'api.stats_retrieved');
    }

    public function nearby(Request $request)
    {
        $lat = $request->get('vi_do');
        $lng = $request->get('kinh_do');
        $radius = $request->get('radius', 5000); // 5km default

        $query = Incident::with(['reporter'])
            ->select([
                '*',
                DB::raw('ST_X(location::geometry) as longitude'),
                DB::raw('ST_Y(location::geometry) as latitude'),
            ]);

        if ($lat && $lng && DB::connection()->getDriverName() === 'pgsql') {
            $query->whereRaw(
                'ST_DWithin(location, ST_SetSRID(ST_Point(?, ?), 4326), ?)',
                [$lng, $lat, $radius / 111320] // Convert meters to degrees approximately
            );
        }

        $incidents = $query->latest()->limit(20)->get();
        
        $mappedItems = $incidents->map(function($incident) {
            return $this->mapIncidentToReport($incident);
        });

        return ApiResponse::success($mappedItems, 'api.nearby_reports_retrieved');
    }

    public function trending()
    {
        $query = Incident::with(['reporter'])
            ->select([
                '*',
                DB::raw('ST_X(location::geometry) as longitude'),
                DB::raw('ST_Y(location::geometry) as latitude'),
            ])
            ->orderByRaw("CAST(JSON_EXTRACT_PATH_TEXT(metadata, 'views') AS INTEGER) DESC")
            ->limit(10);

        $incidents = $query->get();
        
        $mappedItems = $incidents->map(function($incident) {
            return $this->mapIncidentToReport($incident);
        });

        return ApiResponse::success($mappedItems, 'api.trending_reports_retrieved');
    }
}

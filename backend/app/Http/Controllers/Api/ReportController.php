<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\DB;

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
            'dia_chi' => $incident->metadata['address']
                ?? $incident->metadata['location_name']
                ?? 'Không rõ địa chỉ',
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
                    'duong_dan_hinh_anh' => is_string($img) ? $img : $img['url'],
                ];
            })->toArray(),
            'binh_luans' => collect($incident->metadata['comments'] ?? [])->map(function ($c) {
                return [
                    'id' => (int) ($c['id'] ?? 0),
                    'noi_dung' => $c['noi_dung'] ?? '',
                    'luot_thich' => (int) ($c['luot_thich'] ?? 0),
                    'user_liked' => (bool) ($c['user_liked'] ?? false),
                    'created_at' => $c['created_at'] ?? null,
                    'nguoi_dung' => isset($c['ho_ten']) ? [
                        'id' => $c['user_id'] ?? null,
                        'ho_ten' => $c['ho_ten'],
                    ] : null,
                ];
            })->values()->toArray(),
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

        $mappedItems = collect($incidents->items())->map(function ($incident) {
            return $this->mapIncidentToReport($incident);
        });

        // Re-construct pagination response manually or adjust paginator items
        $paginator = new LengthAwarePaginator(
            $mappedItems,
            $incidents->total(),
            $incidents->perPage(),
            $incidents->currentPage(),
            ['path' => Paginator::resolveCurrentPath()]
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

        $mappedItems = collect($incidents->items())->map(function ($incident) {
            return $this->mapIncidentToReport($incident);
        });

        $paginator = new LengthAwarePaginator(
            $mappedItems,
            $incidents->total(),
            $incidents->perPage(),
            $incidents->currentPage(),
            ['path' => Paginator::resolveCurrentPath()]
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
            6 => 'other',
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

        return ApiResponse::success($stats, 'api.report_stats_retrieved');
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

        $mappedItems = $incidents->map(function ($incident) {
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
            ]);

        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            $query->orderByRaw("(COALESCE(NULLIF(metadata->>'views',''),'0'))::int DESC");
        } elseif ($driver === 'sqlite') {
            $query->orderByRaw("CAST(json_extract(metadata, '$.views') AS INTEGER) DESC");
        } else {
            $query->latest();
        }

        $incidents = $query->limit(10)->get();

        $mappedItems = $incidents->map(function ($incident) {
            return $this->mapIncidentToReport($incident);
        });

        return ApiResponse::success($mappedItems, 'api.trending_reports_retrieved');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $incident = Incident::findOrFail($id);
        if ($response = $this->assertOwner($incident, $request)) {
            return $response;
        }

        $validated = $request->validate([
            'tieu_de' => 'sometimes|string|max:255',
            'mo_ta' => 'sometimes|string|min:10',
            'vi_do' => 'sometimes|numeric',
            'kinh_do' => 'sometimes|numeric',
            'dia_chi' => 'sometimes|string|min:1',
            'danh_muc' => 'sometimes|numeric',
            'uu_tien' => 'nullable|numeric',
        ]);

        $numToType = [
            1 => 'accident',
            2 => 'congestion',
            3 => 'construction',
            4 => 'weather',
            5 => 'weather',
            6 => 'other',
        ];

        $numToSeverity = [
            1 => 'low',
            2 => 'medium',
            3 => 'high',
            4 => 'critical',
        ];

        if (isset($validated['tieu_de'])) {
            $incident->title = $validated['tieu_de'];
        }
        if (isset($validated['mo_ta'])) {
            $incident->description = $validated['mo_ta'];
        }
        if (isset($validated['danh_muc'])) {
            $incident->type = $numToType[(int) $validated['danh_muc']] ?? 'other';
        }
        if (array_key_exists('uu_tien', $validated) && $validated['uu_tien'] !== null && $validated['uu_tien'] !== '') {
            $incident->severity = $numToSeverity[(int) $validated['uu_tien']] ?? 'medium';
        }

        $meta = $incident->metadata ?? [];
        if (isset($validated['dia_chi'])) {
            $meta['address'] = $validated['dia_chi'];
        }
        $incident->metadata = $meta;
        $incident->save();

        if (isset($validated['vi_do'], $validated['kinh_do']) && DB::connection()->getDriverName() === 'pgsql') {
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

        return ApiResponse::success($this->mapIncidentToReport($incident), 'api.report_updated');
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $incident = Incident::findOrFail($id);
        if ($response = $this->assertOwner($incident, $request)) {
            return $response;
        }
        $incident->delete();

        return ApiResponse::deleted();
    }

    public function vote(Request $request, $id): JsonResponse
    {
        $incident = Incident::findOrFail($id);
        $validated = $request->validate([
            'loai_binh_chon' => 'required|in:1,-1',
        ]);

        $meta = $incident->metadata ?? [];
        if ((int) $validated['loai_binh_chon'] === 1) {
            $meta['upvotes'] = (int) ($meta['upvotes'] ?? 0) + 1;
        } else {
            $meta['downvotes'] = (int) ($meta['downvotes'] ?? 0) + 1;
        }
        $incident->metadata = $meta;
        $incident->save();

        return ApiResponse::success([
            'luot_ung_ho' => (int) ($meta['upvotes'] ?? 0),
            'luot_khong_ung_ho' => (int) ($meta['downvotes'] ?? 0),
        ], 'api.vote_recorded');
    }

    public function rate(Request $request, $id): JsonResponse
    {
        $incident = Incident::findOrFail($id);
        $validated = $request->validate([
            'diem_so' => 'required|integer|min:1|max:5',
        ]);

        $meta = $incident->metadata ?? [];
        $scores = $meta['rating_scores'] ?? [];
        $scores[] = [
            'user_id' => $request->user()->id,
            'diem_so' => (int) $validated['diem_so'],
            'at' => now()->toIso8601String(),
        ];
        $meta['rating_scores'] = $scores;
        $values = array_column($scores, 'diem_so');
        $meta['rating_average'] = count($values) ? round(array_sum($values) / count($values), 2) : null;
        $incident->metadata = $meta;
        $incident->save();

        return ApiResponse::success([
            'diem_so_trung_binh' => $meta['rating_average'],
            'so_luot_danh_gia' => count($scores),
        ], 'api.rating_recorded');
    }

    public function comment(Request $request, $id): JsonResponse
    {
        $incident = Incident::findOrFail($id);
        $validated = $request->validate([
            'noi_dung' => 'required|string|min:1|max:2000',
        ]);

        $meta = $incident->metadata ?? [];
        $comments = $meta['comments'] ?? [];
        $maxId = 0;
        foreach ($comments as $c) {
            $maxId = max($maxId, (int) ($c['id'] ?? 0));
        }
        $newId = $maxId + 1;
        $row = [
            'id' => $newId,
            'noi_dung' => $validated['noi_dung'],
            'user_id' => $request->user()->id,
            'ho_ten' => $request->user()->name,
            'created_at' => now()->toIso8601String(),
            'luot_thich' => 0,
            'user_liked' => false,
        ];
        $comments[] = $row;
        $meta['comments'] = $comments;
        $incident->metadata = $meta;
        $incident->save();

        return ApiResponse::created([
            'id' => $newId,
            'noi_dung' => $row['noi_dung'],
            'created_at' => $row['created_at'],
            'nguoi_dung' => [
                'id' => $request->user()->id,
                'ho_ten' => $row['ho_ten'],
            ],
            'luot_thich' => 0,
            'user_liked' => false,
        ], 'api.comment_added');
    }

    private function assertOwner(Incident $incident, Request $request): ?JsonResponse
    {
        if ((int) $incident->reported_by !== (int) $request->user()->id) {
            return ApiResponse::forbidden();
        }

        return null;
    }
}

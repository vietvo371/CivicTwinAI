<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Geocoding: forward (search) + reverse (lat/lng → address).
 * Uses Mapbox Geocoding API with Nominatim fallback.
 */
class GeocodeController extends Controller
{
    /**
     * GET /api/geocode/search?q=Da+Nang+Hospital
     *
     * Forward geocoding: search text → list of locations with lat/lng.
     * Used by Priority Route UI to find origin/destination.
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->input('q', ''));
        if ($query === '') {
            return ApiResponse::error('api.validation_failed', 422, ['q' => 'Query is required']);
        }

        $token = trim((string) config('services.mapbox.access_token', ''));

        if ($token !== '') {
            try {
                $res = Http::timeout(10)->get(
                    'https://api.mapbox.com/geocoding/v5/mapbox.places/'.urlencode($query).'.json',
                    [
                        'access_token' => $token,
                        'bbox' => '107.9,15.8,108.6,16.4',  // Da Nang bounding box
                        'limit' => 8,
                        'types' => 'address,poi,place,locality',
                    ]
                );

                if ($res->successful()) {
                    $data = $res->json();
                    $features = $data['features'] ?? [];

                    if ($features !== []) {
                        $results = array_map(fn ($f) => [
                            'id' => $f['id'],
                            'name' => $f['text'] ?? '',
                            'full_name' => $f['place_name'] ?? '',
                            'latitude' => $f['center'][1],
                            'longitude' => $f['center'][0],
                            'place_type' => $f['place_type'][0] ?? '',
                        ], $features);

                        return ApiResponse::success(['results' => $results], 'api.geocode_results');
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Geocode.search_mapbox_failed', ['err' => $e->getMessage()]);
            }
        }

        // Fallback: Nominatim
        try {
            $res = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'CivicTwinAI/1.0'])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'q' => $query.', Da Nang, Vietnam',
                    'format' => 'json',
                    'limit' => 8,
                    'viewbox' => '107.9,15.8,108.6,16.4',
                    'bounded' => 1,
                ]);

            if ($res->successful()) {
                $data = $res->json();
                if (is_array($data) && $data !== []) {
                    $results = array_map(fn ($r) => [
                        'id' => $r['place_id'] ?? '',
                        'name' => $r['display_name'] ?? '',
                        'full_name' => $r['display_name'] ?? '',
                        'latitude' => (float) ($r['lat'] ?? 0),
                        'longitude' => (float) ($r['lon'] ?? 0),
                        'place_type' => $r['type'] ?? '',
                    ], $data);

                    return ApiResponse::success(['results' => $results], 'api.geocode_results');
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Geocode.search_nominatim_failed', ['err' => $e->getMessage()]);
        }

        return ApiResponse::success(['results' => []], 'api.geocode_no_results');
    }

    /**
     * GET /api/geocode/reverse?latitude=16.0544&longitude=108.2022
     *
     * Reverse geocoding: lat/lng → address name.
     */
    public function reverse(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $lat = (float) $validated['latitude'];
        $lng = (float) $validated['longitude'];
        $lang = 'vi';

        $token = trim((string) config('services.mapbox.access_token', ''));

        if ($token !== '') {
            try {
                $res = Http::timeout(18)->get(
                    "https://api.mapbox.com/geocoding/v5/mapbox.places/{$lng},{$lat}.json",
                    ['access_token' => $token, 'language' => $lang, 'limit' => 1]
                );

                if ($res->successful()) {
                    $data = $res->json();
                    $feature = $data['features'][0] ?? null;
                    if ($feature) {
                        return ApiResponse::success([
                            'address' => $feature['place_name'] ?? '',
                            'latitude' => $lat,
                            'longitude' => $lng,
                            'source' => 'mapbox',
                        ], 'api.success');
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Geocode.reverse_mapbox_failed', ['err' => $e->getMessage()]);
            }
        }

        // Nominatim fallback
        try {
            $res = Http::timeout(18)
                ->withHeaders(['User-Agent' => 'CivicTwinAI/1.0 (civictwin.local)'])
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'format' => 'json',
                    'lat' => $lat,
                    'lon' => $lng,
                    'zoom' => 18,
                    'addressdetails' => 1,
                ]);

            if ($res->successful()) {
                $data = $res->json();
                $addr = $data['address'] ?? [];
                $parts = [];
                if (! empty($addr['road'])) {
                    $parts[] = $addr['road'];
                }
                if (! empty($addr['city']) || ! empty($addr['town'])) {
                    $parts[] = $addr['city'] ?? $addr['town'];
                }
                if (! empty($addr['state'])) {
                    $parts[] = $addr['state'];
                }

                return ApiResponse::success([
                    'address' => implode(', ', $parts) ?: ($data['display_name'] ?? ''),
                    'latitude' => $lat,
                    'longitude' => $lng,
                    'source' => 'nominatim',
                ], 'api.success');
            }
        } catch (\Throwable $e) {
            Log::warning('Geocode.reverse_nominatim_failed', ['err' => $e->getMessage()]);
        }

        return ApiResponse::success([
            'address' => sprintf('%.6f, %.6f', $lat, $lng),
            'latitude' => $lat,
            'longitude' => $lng,
            'source' => 'coordinates',
        ], 'api.geocode_fallback_coordinates');
    }
}

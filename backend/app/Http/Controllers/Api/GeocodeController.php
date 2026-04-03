<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Reverse geocoding qua backend — mobile tránh gọi trực tiếp Mapbox/Nominatim (RN hay fail → chỉ còn lat,lng).
 */
class GeocodeController extends Controller
{
    public function reverse(Request $request)
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $lat = (float) $validated['latitude'];
        $lng = (float) $validated['longitude'];

        $locale = strtolower((string) $request->header('x-Language', $request->header('Accept-Language', 'vi')));
        $lang = str_starts_with($locale, 'vi') ? 'vi' : 'en';

        $token = trim((string) config('services.mapbox.access_token', ''));

        if ($token !== '') {
            try {
                $url = sprintf(
                    'https://api.mapbox.com/geocoding/v5/mapbox.places/%s,%s.json',
                    $lng,
                    $lat
                );
                $res = Http::timeout(18)->get($url, [
                    'access_token' => $token,
                    'language' => $lang,
                    'limit' => 1,
                ]);

                if ($res->successful()) {
                    $data = $res->json();
                    $feature = is_array($data) ? ($data['features'][0] ?? null) : null;
                    $short = is_array($feature) ? $this->shortLineFromMapboxFeature($feature) : '';
                    if ($short !== '') {
                        return ApiResponse::success([
                            'address' => $short,
                            'latitude' => $lat,
                            'longitude' => $lng,
                            'source' => 'mapbox',
                        ], 'api.success');
                    }
                }

                Log::warning('Geocode Mapbox: no place_name', [
                    'status' => $res->status(),
                    'snippet' => mb_substr($res->body(), 0, 400),
                ]);
            } catch (\Throwable $e) {
                Log::warning('Geocode Mapbox exception: '.$e->getMessage());
            }
        } else {
            Log::notice('Geocode: MAPBOX_ACCESS_TOKEN empty on server, using Nominatim only');
        }

        try {
            $res = Http::timeout(18)
                ->withHeaders([
                    'User-Agent' => (config('app.name') ?: 'CivicTwinAI').'/1.0; '.(config('app.url') ?: 'https://civictwin.local'),
                    'Accept-Language' => $lang === 'vi' ? 'vi,en' : 'en',
                ])
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'format' => 'json',
                    'lat' => $lat,
                    'lon' => $lng,
                    'zoom' => 18,
                    'addressdetails' => 1,
                ]);

            if ($res->successful()) {
                $data = $res->json();
                $addr = is_array($data) && isset($data['address']) && is_array($data['address'])
                    ? $data['address']
                    : null;
                $short = $this->shortLineFromNominatimAddress($addr);
                if ($short !== '') {
                    return ApiResponse::success([
                        'address' => $short,
                        'latitude' => $lat,
                        'longitude' => $lng,
                        'source' => 'nominatim',
                    ], 'api.success');
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Geocode Nominatim exception: '.$e->getMessage());
        }

        $fallback = sprintf('%.6f, %.6f', $lat, $lng);

        return ApiResponse::success([
            'address' => $fallback,
            'latitude' => $lat,
            'longitude' => $lng,
            'source' => 'coordinates',
        ], 'api.geocode_fallback_coordinates');
    }

    /**
     * Chỉ: tên đường / điểm nhấn + thành phố (place) + tỉnh/bang (region). Bỏ quận, postcode, country.
     */
    private function shortLineFromMapboxFeature(array $feature): string
    {
        $text = trim((string) ($feature['text'] ?? ''));
        $city = '';
        $province = '';
        foreach ($feature['context'] ?? [] as $ctx) {
            if (! is_array($ctx)) {
                continue;
            }
            $id = (string) ($ctx['id'] ?? '');
            $t = trim((string) ($ctx['text'] ?? ''));
            if ($t === '') {
                continue;
            }
            if (str_starts_with($id, 'district.')) {
                continue;
            }
            if (str_starts_with($id, 'place.') || str_starts_with($id, 'locality.')) {
                $city = $t;
            }
            if (str_starts_with($id, 'region.')) {
                $province = $t;
            }
        }

        $streetish = $text;
        if ($streetish !== '' && $city !== '' && mb_strtolower($streetish) === mb_strtolower($city)) {
            $streetish = '';
        }

        $parts = $this->dedupeAdminParts(array_filter([$streetish, $city, $province]));
        if ($parts !== []) {
            return implode(', ', $parts);
        }

        $adminOnly = $this->dedupeAdminParts(array_filter([$city, $province]));

        return $adminOnly !== [] ? implode(', ', $adminOnly) : '';
    }

    /**
     * road + city/town/village + state/province (Nominatim addressdetails).
     */
    private function shortLineFromNominatimAddress(?array $address): string
    {
        if ($address === null) {
            return '';
        }

        $road = trim((string) ($address['road'] ?? $address['pedestrian'] ?? $address['path'] ?? ''));
        $city = trim((string) ($address['city'] ?? $address['town'] ?? $address['village'] ?? $address['municipality'] ?? ''));
        $province = trim((string) ($address['state'] ?? $address['province'] ?? ''));

        if ($city === '' && isset($address['city_district'])) {
            $city = trim((string) $address['city_district']);
        }

        $parts = $this->dedupeAdminParts(array_filter([$road, $city, $province]));

        return $parts !== [] ? implode(', ', $parts) : '';
    }

    /**
     * @param  array<int, string>  $parts
     * @return array<int, string>
     */
    private function dedupeAdminParts(array $parts): array
    {
        $out = [];
        foreach ($parts as $p) {
            $p = trim($p);
            if ($p === '') {
                continue;
            }
            $lower = mb_strtolower($p);
            if ($out !== []) {
                $last = $out[count($out) - 1];
                if (mb_strtolower((string) $last) === $lower) {
                    continue;
                }
            }
            $out[] = $p;
        }

        return $out;
    }
}

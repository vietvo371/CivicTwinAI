import api from '../utils/Api';
import { ApiResponse } from '../types/api/common';
import { MapReport, HeatmapPoint, Route, MapBounds } from '../types/api/map';
import env from '../config/env';

function dedupeGeocodeParts(parts: string[]): string[] {
    const out: string[] = [];
    for (const p of parts) {
        const t = p.trim();
        if (!t) continue;
        const low = t.toLowerCase();
        if (out.length && out[out.length - 1].toLowerCase() === low) continue;
        out.push(t);
    }
    return out;
}

/** Đồng bộ với GeocodeController: đường + thành phố + tỉnh (bỏ quận, postcode, country). */
function shortLineFromMapboxFeature(feature: Record<string, unknown> | undefined): string {
    if (!feature) return '';
    const text = String(feature.text ?? '').trim();
    let city = '';
    let province = '';
    const context = Array.isArray(feature.context) ? feature.context : [];
    for (const ctx of context) {
        if (!ctx || typeof ctx !== 'object') continue;
        const c = ctx as { id?: string; text?: string };
        const id = String(c.id ?? '');
        const t = String(c.text ?? '').trim();
        if (!t) continue;
        if (id.startsWith('district.')) continue;
        if (id.startsWith('place.') || id.startsWith('locality.')) city = t;
        if (id.startsWith('region.')) province = t;
    }
    let streetish = text;
    if (streetish && city && streetish.toLowerCase() === city.toLowerCase()) {
        streetish = '';
    }
    const triple = dedupeGeocodeParts([streetish, city, province].filter(Boolean));
    if (triple.length) return triple.join(', ');
    const admin = dedupeGeocodeParts([city, province].filter(Boolean));
    return admin.length ? admin.join(', ') : '';
}

function shortLineFromNominatimAddress(addr: unknown): string {
    if (!addr || typeof addr !== 'object') return '';
    const a = addr as Record<string, string | undefined>;
    const road = String(a.road ?? a.pedestrian ?? a.path ?? '').trim();
    let city = String(a.city ?? a.town ?? a.village ?? a.municipality ?? '').trim();
    const province = String(a.state ?? a.province ?? '').trim();
    if (!city && a.city_district) city = String(a.city_district).trim();
    const parts = dedupeGeocodeParts([road, city, province].filter(Boolean));
    return parts.length ? parts.join(', ') : '';
}

export const mapService = {
    getMapReports: async (bounds: MapBounds, filters?: any): Promise<ApiResponse<MapReport[]>> => {
        const boundsStr = `${bounds.min_lat},${bounds.min_lon},${bounds.max_lat},${bounds.max_lon}`;
        console.log('MapService - Bounds string:', boundsStr);
        console.log('MapService - Filters:', filters);
        console.log('MapService - Full params:', { bounds: boundsStr, ...filters });

        const response = await api.get<ApiResponse<MapReport[]>>('/map/reports', {
            params: { bounds: boundsStr, ...filters }
        });

        console.log('MapService - Raw response:', response);
        return response.data;
    },

    getHeatmap: async (days: number = 7): Promise<ApiResponse<HeatmapPoint[]>> => {
        const response = await api.get<ApiResponse<HeatmapPoint[]>>('/map/heatmap', {
            params: { days }
        });
        return response.data;
    },

    getTrafficEdges: async (): Promise<any> => {
        const response = await api.get('/edges/geojson');
        return response.data;
    },

    getClusters: async (zoom: number): Promise<ApiResponse<import('../types/api/map').ClusterMarker[]>> => {
        const response = await api.get<ApiResponse<import('../types/api/map').ClusterMarker[]>>('/map/clusters', {
            params: { zoom }
        });
        return response.data;
    },

    getRoutes: async (): Promise<ApiResponse<Route[]>> => {
        // Note: API returns "coming soon" - placeholder for future GTFS routes
        const response = await api.get<ApiResponse<Route[]>>('/map/routes');
        return response.data;
    },

    reverseGeocode: async (lat: number, long: number): Promise<string> => {
        const fallback = `${lat.toFixed(6)}, ${long.toFixed(6)}`;
        const token = (env.MAPBOX_ACCESS_TOKEN || '').trim();

        // 0) Backend (Mapbox token trên server + Nominatim) — ổn định hơn fetch trực tiếp từ RN
        try {
            const backend = await api.get<
                ApiResponse<{
                    address: string;
                    source?: 'mapbox' | 'nominatim' | 'coordinates';
                }>
            >('/geocode/reverse', {
                params: { latitude: lat, longitude: long },
                timeout: 22000,
            });
            const payload = backend.data;
            const addr = payload?.data?.address?.trim();
            const src = payload?.data?.source;
            if (payload?.success && addr && src && src !== 'coordinates') {
                return addr;
            }
        } catch (e: any) {
            if (env.DEBUG) {
                console.warn('[mapService] Backend reverse geocode:', e?.message || e);
            }
        }

        // 1) Mapbox — không dùng AbortSignal timeout: RN hay báo "Aborted" / hủy sớm khi mạng chậm hoặc gọi chồng
        if (token) {
            try {
                const url =
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json` +
                    `?access_token=${encodeURIComponent(token)}&language=vi&limit=1`;
                const res = await fetch(url, { method: 'GET' });
                if (res.ok) {
                    const geo = await res.json();
                    const feature = geo.features?.[0];
                    const short = shortLineFromMapboxFeature(feature);
                    if (short) return short;
                } else if (env.DEBUG) {
                    console.warn('[mapService] Mapbox HTTP', res.status, await res.text().catch(() => ''));
                }
            } catch (e: any) {
                if (env.DEBUG) {
                    console.warn('[mapService] Mapbox reverse geocode:', e?.message || e);
                }
            }
        }

        // 2) Nominatim (dự phòng)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}&zoom=18&addressdetails=1`,
                {
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'CivicTwinAI/1.0 (mobile; contact@civictwin.local)',
                        'Accept-Language': 'vi',
                    },
                },
            );
            clearTimeout(timeoutId);
            if (!response.ok) {
                return fallback;
            }
            const data = await response.json();
            const short = shortLineFromNominatimAddress(data.address);
            if (short) return short;
            return fallback;
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (env.DEBUG) {
                if (error?.name === 'AbortError') {
                    console.warn('[mapService] Nominatim reverse geocode: timeout');
                } else {
                    console.warn(
                        '[mapService] Nominatim reverse geocode:',
                        error?.message || error,
                    );
                }
            }
            return fallback;
        }
    },
};

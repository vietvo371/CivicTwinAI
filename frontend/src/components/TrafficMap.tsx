'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import api from '@/lib/api';
import { Layers, RefreshCw } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtbyIsImEiOiJjbHM0MjF0eG4wMDNqMmtvNGdqMDIxYmRyIn0.demo';

const CONGESTION_COLORS: Record<string, string> = {
  none: '#22c55e',
  light: '#84cc16',
  moderate: '#f59e0b',
  heavy: '#ef4444',
  gridlock: '#dc2626',
};

interface EdgeFeature {
  type: string;
  id: number;
  geometry: { type: string; coordinates: number[][] };
  properties: {
    id: number;
    name: string;
    current_density: number;
    current_speed_kmh: number;
    congestion_level: string;
    lanes: number;
    speed_limit_kmh: number;
    status: string;
  };
}

export default function TrafficMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, congested: 0, avgDensity: 0 });

  const loadGeoJSON = async () => {
    try {
      const res = await api.get('/edges/geojson');
      const data = res.data;

      if (map.current?.getSource('edges')) {
        (map.current.getSource('edges') as mapboxgl.GeoJSONSource).setData(data);
      }

      const features: EdgeFeature[] = data.features || [];
      const congested = features.filter((f) =>
        ['heavy', 'gridlock'].includes(f.properties.congestion_level)
      ).length;
      const avgDensity = features.length
        ? features.reduce((sum, f) => sum + f.properties.current_density, 0) / features.length
        : 0;

      setStats({ total: features.length, congested, avgDensity: Math.round(avgDensity * 100) });
    } catch (err) {
      console.error('Failed to load GeoJSON:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [106.695, 10.785],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      map.current!.addSource('edges', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.current!.addLayer({
        id: 'edges-line',
        type: 'line',
        source: 'edges',
        paint: {
          'line-color': [
            'match', ['get', 'congestion_level'],
            'none', CONGESTION_COLORS.none,
            'light', CONGESTION_COLORS.light,
            'moderate', CONGESTION_COLORS.moderate,
            'heavy', CONGESTION_COLORS.heavy,
            'gridlock', CONGESTION_COLORS.gridlock,
            '#64748b',
          ],
          'line-width': [
            'interpolate', ['linear'], ['zoom'],
            12, 3,
            16, 8,
          ],
          'line-opacity': 0.85,
        },
      });

      // Click popup
      map.current!.on('click', 'edges-line', (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties!;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family: Inter, sans-serif;">
              <div style="font-weight: 600; margin-bottom: 6px;">${p.name}</div>
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; font-size: 12px;">
                <span style="color: var(--text-muted);">Mật độ</span>
                <span>${(p.current_density * 100).toFixed(1)}%</span>
                <span style="color: var(--text-muted);">Tốc độ</span>
                <span>${p.current_speed_kmh} km/h</span>
                <span style="color: var(--text-muted);">Làn</span>
                <span>${p.lanes}</span>
                <span style="color: var(--text-muted);">Trạng thái</span>
                <span style="color: ${CONGESTION_COLORS[p.congestion_level] || '#64748b'}; font-weight: 600;">
                  ${p.congestion_level}
                </span>
              </div>
            </div>
          `)
          .addTo(map.current!);
      });

      map.current!.on('mouseenter', 'edges-line', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'edges-line', () => {
        map.current!.getCanvas().style.cursor = '';
      });

      loadGeoJSON();
    });

    return () => { map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh)]">
      <div ref={mapContainer} className="w-full h-full" />

      {/* KPI Overlay */}
      <div className="absolute top-4 left-4 flex gap-3 z-10">
        {[
          { label: 'Tổng đoạn', value: stats.total, color: 'var(--accent)' },
          { label: 'Tắc nghẽn', value: stats.congested, color: 'var(--danger)' },
          { label: 'Mật độ TB', value: `${stats.avgDensity}%`, color: 'var(--warning)' },
        ].map((kpi) => (
          <div key={kpi.label} className="px-4 py-3 rounded-xl backdrop-blur-md"
            style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
            <div className="text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Legend + Refresh */}
      <div className="absolute bottom-6 left-4 z-10 flex gap-3">
        <div className="px-4 py-3 rounded-xl backdrop-blur-md"
          style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Mức tắc nghẽn</span>
          </div>
          <div className="flex gap-3">
            {Object.entries(CONGESTION_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{level}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setLoading(true); loadGeoJSON(); }}
          disabled={loading}
          className="p-3 rounded-xl backdrop-blur-md transition-colors hover:bg-[var(--bg-hover)]"
          style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border)' }}
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
            style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>
    </div>
  );
}

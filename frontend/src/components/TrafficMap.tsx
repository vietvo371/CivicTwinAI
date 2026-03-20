'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import api from '@/lib/api';
import { Layers, RefreshCw, Activity, AlertTriangle, TrendingUp } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGVtbyIsImEiOiJjbHM0MjF0eG4wMDNqMmtvNGdqMDIxYmRyIn0.demo';

const CONGESTION_COLORS: Record<string, string> = {
  none: '#22c55e',       // green-500
  light: '#eab308',      // yellow-500
  moderate: '#f97316',   // orange-500
  heavy: '#ef4444',      // red-500
  gridlock: '#9f1239',   // rose-800
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

interface TrafficMapProps {
  isPublic?: boolean;
}

export default function TrafficMap({ isPublic = false }: TrafficMapProps) {
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
            '#475569', // slate-600 default
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
            <div style="font-family: var(--font-body); min-width: 200px;">
              <div style="font-weight: 700; font-family: var(--font-heading); font-size: 15px; margin-bottom: 12px; border-bottom: 1px solid rgba(71,85,105,0.5); padding-bottom: 8px;">
                ${p.name}
              </div>
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: 13px;">
                <span style="color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px;">
                  <span style="width:14px; height:14px; display:inline-block; border-radius:2px; background:rgba(59,130,246,0.2); border:1px solid #3b82f6;"></span>
                  Mật độ
                </span>
                <span style="font-family: var(--font-heading); font-weight: 600;">${(p.current_density * 100).toFixed(1)}%</span>
                
                <span style="color: var(--color-text-secondary); display: flex; align-items: center; gap: 6px;">
                  <span style="width:14px; height:14px; display:inline-block; border-radius:2px; background:rgba(16,185,129,0.2); border:1px solid #10b981;"></span>
                  Tốc độ
                </span>
                <span style="font-family: var(--font-heading); font-weight: 600;">${p.current_speed_kmh} 
                  <span style="font-size: 10px; color: var(--color-text-muted);">km/h</span>
                </span>
                
                <span style="color: var(--color-text-secondary);">Làn xe</span>
                <span style="font-weight: 500;">${p.lanes}</span>
                
                <span style="color: var(--color-text-secondary);">Trạng thái</span>
                <span style="color: ${CONGESTION_COLORS[p.congestion_level] || '#64748b'}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px;">
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
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-700/50 bg-slate-900">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* KPI Overlay - Top Right or Top Left depending on controls */}
      <div className="absolute top-4 left-4 flex flex-col sm:flex-row gap-3 z-10">
        <div className="flex flex-col gap-1 px-5 py-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-lg group hover:border-slate-600 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> Tổng đoạn đường
          </div>
          <div className="text-2xl font-heading font-bold text-blue-400">
            {stats.total.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col gap-1 px-5 py-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-lg group hover:border-slate-600 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Tắc nghẽn
          </div>
          <div className="text-2xl font-heading font-bold text-red-500 flex items-baseline gap-2">
            {stats.congested}
            {stats.total > 0 && (
              <span className="text-sm font-body font-medium text-slate-500">
                ({Math.round((stats.congested / stats.total) * 100)}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 px-5 py-3.5 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-lg group hover:border-slate-600 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> Mật độ TB
          </div>
          <div className="text-2xl font-heading font-bold text-orange-400 line-clamp-1">
            {stats.avgDensity}%
          </div>
        </div>
      </div>

      {/* Legend & Controls - Bottom Left */}
      <div className="absolute bottom-6 left-4 z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Legend */}
        <div className="px-5 py-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-[13px] font-semibold text-slate-200 tracking-wide uppercase">Mức độ lưu thông</span>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-x-4 gap-y-2">
            {Object.entries(CONGESTION_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div 
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-slate-800 shadow-sm" 
                  style={{ background: color, boxShadow: `0 0 8px ${color}80` }} 
                />
                <span className="text-xs font-medium text-slate-300 capitalize tracking-wide">{level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => { setLoading(true); loadGeoJSON(); }}
          disabled={loading}
          className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`w-5 h-5 text-slate-300 group-hover:text-white transition-colors ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>
    </div>
  );
}

'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '@/lib/api';
import { AlertTriangle, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { useTheme } from 'next-themes';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface TrafficMapProps {
  isPublic?: boolean;
}

export default function TrafficMap({ isPublic = false }: TrafficMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { theme, resolvedTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [totalEdges, setTotalEdges] = useState(0);
  const [congestedCount, setCongestedCount] = useState(0);
  const [avgDensity, setAvgDensity] = useState(0);

  const getMapStyleUrl = () => {
    return resolvedTheme === 'dark' 
      ? 'mapbox://styles/mapbox/dark-v11' 
      : 'mapbox://styles/mapbox/standard';
  };

  const loadGeoJSON = async () => {
    try {
      const endpoint = isPublic ? '/public/edges/geojson' : '/edges/geojson';
      const res = await api.get(endpoint);
      const data = res.data;

      setTotalEdges(data.features.length);
      
      let congested = 0;
      let totalDensity = 0;
      data.features.forEach((f: any) => {
        const den = f.properties.current_density || 0;
        totalDensity += den;
        if (den > 0.6) congested++;
      });
      setCongestedCount(congested);
      setAvgDensity(data.features.length > 0 ? totalDensity / data.features.length : 0);

      const source = map.current?.getSource('traffic-edges') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(data);
      }
    } catch (err: any) {
      console.error('Failed to load map data:', err);
      setError('Unable to load map data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (map.current || !mapContainer.current) return;

    if (!mapboxgl.accessToken) {
      setError('Mapbox Access Token is missing.');
      setLoading(false);
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: getMapStyleUrl(),
        center: [106.6953, 10.7828], // Hochiminh City
        zoom: 14,
        pitch: 45,
        bearing: -17.6,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        if (!map.current) return;

        map.current.addSource('traffic-edges', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });

        // Add line layer for edges with dynamic coloring based on density
        map.current.addLayer({
          id: 'traffic-lines',
          type: 'line',
          source: 'traffic-edges',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-width': [
              'interpolate', ['linear'], ['zoom'],
              10, 2,
              15, 6
            ],
            'line-color': [
              'interpolate',
              ['linear'],
              ['get', 'current_density'],
              0.0, '#10b981', // green / free flow
              0.4, '#eab308', // yellow / light traffic
              0.6, '#f97316', // orange / moderate traffic
              0.8, '#ef4444', // red / heavy traffic
              1.0, '#881337'  // dark red / jam
            ]
          }
        });

        // Setup popups on hover
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'custom-popup'
        });

        map.current.on('mouseenter', 'traffic-lines', (e) => {
          if (!map.current || !e.features || e.features.length === 0) return;
          map.current.getCanvas().style.cursor = 'pointer';

          const coordinates = e.lngLat;
          const { id, name, current_speed_kmh, current_density } = e.features[0].properties as any;

          const html = `
            <div class="p-3 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border min-w-[200px]">
              <div class="font-bold text-sm mb-1">${name || 'Unnamed Street'}</div>
              <div class="text-xs text-muted-foreground mb-2">ID: ${id}</div>
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-semibold">Speed:</span>
                <span class="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">${(current_speed_kmh || 0).toFixed(1)} km/h</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold">Capacity:</span>
                <span class="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">${((current_density || 0) * 100).toFixed(0)}%</span>
              </div>
            </div>
          `;

          popup.setLngLat(coordinates).setHTML(html).addTo(map.current);
        });

        map.current.on('mouseleave', 'traffic-lines', () => {
          if (!map.current) return;
          map.current.getCanvas().style.cursor = '';
          popup.remove();
        });

        loadGeoJSON();
      });
    } catch (err: any) {
      console.error("Mapbox init error:", err);
      setError(err.message || "Failed to initialize map");
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeMap();
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Run once on mount

  // Watch for theme changes and update map style
  useEffect(() => {
    if (map.current?.isStyleLoaded()) {
      map.current.setStyle(getMapStyleUrl());
    }
  }, [resolvedTheme]);

  if (error) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-card rounded-2xl border border-border">
        <div className="text-center p-6 bg-destructive/10 rounded-xl border border-destructive/20 max-w-md">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">Connection Error</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-8rem)] min-h-[600px] rounded-2xl overflow-hidden relative shadow-2xl border border-border ring-1 ring-white/5">
      {loading && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4 border border-border">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="font-semibold tracking-wide text-sm">Rendering Spatial Engine...</span>
          </div>
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full" />

      {/* KPI Overlay */}
      <div className="absolute top-6 left-6 flex flex-wrap gap-4 z-10 pointer-events-none">
        <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border min-w-[140px] pointer-events-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-500" /> TOTAL SEGMENTS
          </div>
          <div className="text-3xl font-heading font-black text-blue-500">{totalEdges}</div>
        </div>

        <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border min-w-[140px] pointer-events-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> CONGESTION
          </div>
          <div className="text-3xl font-heading font-black text-rose-500">
            {congestedCount} <span className="text-sm font-medium text-muted-foreground ml-1">({totalEdges ? Math.round((congestedCount / totalEdges) * 100) : 0}%)</span>
          </div>
        </div>

        <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border min-w-[140px] pointer-events-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-500" /> AVG. DENSITY
          </div>
          <div className="text-3xl font-heading font-black text-amber-500">
            {(avgDensity * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Legend & Controls Overlay */}
      <div className="absolute bottom-6 left-6 flex items-end gap-4 z-10 pointer-events-none">
        
        <div className="bg-card/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-border pointer-events-auto">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> FLOW INTENSITY
          </div>
          <div className="flex items-center gap-4">
            {[
              { level: 'none', color: '#10b981' }, 
              { level: 'light', color: '#eab308' }, 
              { level: 'moderate', color: '#f97316' }, 
              { level: 'heavy', color: '#ef4444' }, 
              { level: 'gridlock', color: '#881337' }
            ].map(({ level, color }) => (
              <div key={level} className="flex items-center gap-2">
                <div 
                  className="w-3.5 h-3.5 rounded-full shadow-sm" 
                  style={{ background: color, boxShadow: `0 0 8px ${color}80` }} 
                />
                <span className="text-xs font-medium text-muted-foreground capitalize tracking-wide">{level}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setLoading(true); loadGeoJSON(); }}
          disabled={loading}
          className="p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-border shadow-lg hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer text-muted-foreground hover:text-foreground pointer-events-auto"
          title="Refresh Data"
        >
          <RefreshCw className={`w-5 h-5 transition-colors ${loading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>
    </div>
  );
}

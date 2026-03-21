'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  Camera, Maximize2, Minimize2, Wifi, WifiOff,
  MapPin, Clock, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CCTVFeed {
  id: number;
  name: string;
  location: string;
  status: 'online' | 'offline';
  lastUpdate: string;
  thumbnail: string;
}

const DEMO_FEEDS: CCTVFeed[] = [
  { id: 1, name: 'CAM-001', location: 'Cau Rong (dau Hai Chau)', status: 'online', lastUpdate: '08:55', thumbnail: '/cctv-placeholder.svg' },
  { id: 2, name: 'CAM-002', location: 'Cau Song Han (dau Son Tra)', status: 'online', lastUpdate: '08:55', thumbnail: '/cctv-placeholder.svg' },
  { id: 3, name: 'CAM-003', location: 'Nga tu Dien Bien Phu - Le Duan', status: 'online', lastUpdate: '08:55', thumbnail: '/cctv-placeholder.svg' },
  { id: 4, name: 'CAM-004', location: 'Duong Nguyen Van Linh', status: 'offline', lastUpdate: '07:12', thumbnail: '/cctv-placeholder.svg' },
  { id: 5, name: 'CAM-005', location: 'Bai bien My Khe', status: 'online', lastUpdate: '08:54', thumbnail: '/cctv-placeholder.svg' },
  { id: 6, name: 'CAM-006', location: 'Cau Thuan Phuoc', status: 'online', lastUpdate: '08:55', thumbnail: '/cctv-placeholder.svg' },
  { id: 7, name: 'CAM-007', location: 'Nga ba Hue', status: 'online', lastUpdate: '08:53', thumbnail: '/cctv-placeholder.svg' },
  { id: 8, name: 'CAM-008', location: 'San bay Da Nang', status: 'offline', lastUpdate: '06:30', thumbnail: '/cctv-placeholder.svg' },
  { id: 9, name: 'CAM-009', location: 'Cau Tran Thi Ly', status: 'online', lastUpdate: '08:55', thumbnail: '/cctv-placeholder.svg' },
];

export default function CCTVPage() {
  const { t, locale } = useTranslation();
  const [expanded, setExpanded] = useState<number | null>(null);
  const onlineCount = DEMO_FEEDS.filter(f => f.status === 'online').length;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Camera className="w-6 h-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.cctvMonitoring')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('op.camerasOnline', { online: String(onlineCount), total: String(DEMO_FEEDS.length) })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1.5 text-emerald-500 border-emerald-500/20">
            <Wifi className="w-3 h-3" /> {onlineCount} {t('op.online')}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1.5 text-rose-500 border-rose-500/20">
            <WifiOff className="w-3 h-3" /> {DEMO_FEEDS.length - onlineCount} {t('op.offline')}
          </Badge>
        </div>
      </div>

      {/* Expanded View */}
      {expanded !== null && (
        <Card className="bg-card/50 backdrop-blur-xl shadow-2xl border-border/80 overflow-hidden animate-in zoom-in-95 duration-300">
          <CardContent className="p-0 relative">
            <div className="aspect-video bg-slate-950 flex items-center justify-center relative">
              <div className="text-center space-y-4">
                <Camera className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                <div>
                  <p className="text-lg font-heading font-bold">{DEMO_FEEDS.find(f => f.id === expanded)?.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {DEMO_FEEDS.find(f => f.id === expanded)?.location}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/50 uppercase tracking-widest">{t('op.liveFeedPlaceholder')}</p>
              </div>

              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge className="bg-rose-500/80 text-white border-0 text-[10px] uppercase tracking-wider gap-1 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" /> {t('op.live')}
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setExpanded(null)}
                  className="p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 text-xs text-white/60 font-mono flex items-center gap-2">
                <Clock className="w-3 h-3" /> {new Date().toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_FEEDS.map((feed) => (
          <Card
            key={feed.id}
            className={`bg-card/40 backdrop-blur-xl shadow-lg border-border/80 overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-xl transition-all group ${
              feed.status === 'offline' ? 'opacity-60' : ''
            } ${expanded === feed.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => feed.status === 'online' && setExpanded(feed.id)}
          >
            <CardContent className="p-0">
              <div className="aspect-video bg-slate-950/80 flex items-center justify-center relative overflow-hidden">
                <Camera className="w-10 h-10 text-muted-foreground/20" />

                <div className="absolute top-3 left-3">
                  {feed.status === 'online' ? (
                    <Badge className="bg-emerald-500/80 text-white border-0 text-[9px] uppercase tracking-wider gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {t('op.live')}
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/60 text-white border-0 text-[9px] uppercase tracking-wider gap-1">
                      <WifiOff className="w-2.5 h-2.5" /> {t('op.offline')}
                    </Badge>
                  )}
                </div>

                {feed.status === 'online' && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-black/50 hover:bg-black/70 rounded-lg transition-colors">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}

                <div className="absolute bottom-2 right-3 text-[10px] text-white/40 font-mono">
                  {feed.lastUpdate}
                </div>
              </div>

              <div className="p-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{feed.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" /> {feed.location}
                    </p>
                  </div>
                  <Shield className={`w-4 h-4 shrink-0 ${feed.status === 'online' ? 'text-emerald-500' : 'text-muted-foreground/30'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

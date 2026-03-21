'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Activity, AlertTriangle, Clock, Brain, TrendingUp,
  ShieldAlert, CheckCircle2, ArrowUpRight, ChevronRight,
  Zap, Users, Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const TrafficMap = dynamic(() => import('@/components/TrafficMap'), { ssr: false });

// Demo data fallback
const DEMO_INCIDENTS = [
  { id: 1, title: 'Va cham Container tren Cau Rong', type: 'accident', severity: 'critical', status: 'investigating', created_at: '2026-03-21T08:15:00Z' },
  { id: 2, title: 'Ngap nuoc duong Nguyen Huu Tho (Cam Le)', type: 'weather', severity: 'critical', status: 'open', created_at: '2026-03-21T07:30:00Z' },
  { id: 3, title: 'Thi cong mat duong Dien Bien Phu', type: 'construction', severity: 'medium', status: 'open', created_at: '2026-03-21T06:00:00Z' },
  { id: 4, title: 'Den tin hieu hu tai Nga tu Le Duan - DBP', type: 'other', severity: 'high', status: 'open', created_at: '2026-03-21T05:45:00Z' },
  { id: 5, title: 'Un tac gio cao diem Cau Song Han', type: 'congestion', severity: 'high', status: 'investigating', created_at: '2026-03-20T17:00:00Z' },
];

const DEMO_AI_FEED = [
  { id: 1, incident_id: 1, model_version: 'GNN-v2.1', status: 'completed', processing_time_ms: 342, edges_affected: 12, created_at: '2026-03-21T08:16:00Z' },
  { id: 2, incident_id: 2, model_version: 'LSTM-v1.4', status: 'completed', processing_time_ms: 189, edges_affected: 8, created_at: '2026-03-21T07:31:00Z' },
  { id: 3, incident_id: 4, model_version: 'GNN-v2.1', status: 'failed', processing_time_ms: 1200, edges_affected: 0, created_at: '2026-03-21T05:46:00Z' },
];

const severityStyle: Record<string, string> = {
  low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
};

const statusStyle: Record<string, { color: string; icon: React.ReactNode }> = {
  open: { color: 'text-blue-400', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  investigating: { color: 'text-amber-400', icon: <Clock className="w-3.5 h-3.5" /> },
  resolved: { color: 'text-emerald-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: { value: string; up: boolean };
  accentColor: string;
}

function KPICard({ title, value, subtitle, icon, trend, accentColor }: KPICardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/80 shadow-lg hover:shadow-xl hover:border-border transition-all group relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentColor} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-secondary/80 border border-border/50 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          {trend && (
            <span className={`text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-full ${trend.up ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
              <TrendingUp className={`w-3 h-3 ${trend.up ? '' : 'rotate-180'}`} />
              {trend.value}
            </span>
          )}
        </div>
        <div className="text-3xl font-heading font-black tracking-tight mb-1">{value}</div>
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [incidents, setIncidents] = useState(DEMO_INCIDENTS);
  const [aiFeed] = useState(DEMO_AI_FEED);

  useEffect(() => {
    api.get('/incidents?per_page=5')
      .then((res) => {
        if (res.data.data?.length > 0) setIncidents(res.data.data);
      })
      .catch(() => { /* fallback to demo data */ });
  }, []);

  const openCount = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Command Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational — Real-time monitoring active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          Last sync: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Incidents"
          value={openCount}
          subtitle={`${incidents.length} total this period`}
          icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
          trend={{ value: '+2', up: true }}
          accentColor="from-orange-500 to-amber-500"
        />
        <KPICard
          title="AI Predictions"
          value={aiFeed.filter(a => a.status === 'completed').length}
          subtitle={`${aiFeed.length} sessions total`}
          icon={<Brain className="w-5 h-5 text-violet-500" />}
          trend={{ value: '98.2%', up: false }}
          accentColor="from-violet-500 to-purple-500"
        />
        <KPICard
          title="Avg. Response"
          value="4.2m"
          subtitle="Mean time to first response"
          icon={<Timer className="w-5 h-5 text-blue-500" />}
          trend={{ value: '-0.8m', up: false }}
          accentColor="from-blue-500 to-cyan-500"
        />
        <KPICard
          title="Operators Online"
          value={3}
          subtitle="Across 2 districts"
          icon={<Users className="w-5 h-5 text-emerald-500" />}
          accentColor="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Main Content: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Traffic Map */}
        <div className="lg:col-span-8">
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden border-border/80">
            <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Live Traffic Grid
              </CardTitle>
              <Link href="/dashboard" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Full Screen <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="h-[420px] rounded-xl overflow-hidden border border-border/50">
                <TrafficMap />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar: Recent + AI Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Incidents */}
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl border-border/80">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Recent Incidents
              </CardTitle>
              <Link href="/dashboard/incidents" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2">
                {incidents.slice(0, 5).map((inc) => {
                  const sev = severityStyle[inc.severity] || severityStyle.medium;
                  const stat = statusStyle[inc.status] || statusStyle.open;
                  return (
                    <Link
                      key={inc.id}
                      href="/dashboard/incidents"
                      className="flex items-start gap-3 p-3 rounded-xl bg-background/50 hover:bg-accent/50 border border-transparent hover:border-border transition-all group/item cursor-pointer"
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${inc.status === 'open' ? 'bg-blue-500 animate-pulse' : inc.status === 'investigating' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover/item:text-primary transition-colors">{inc.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 h-5 border ${sev}`}>
                            {inc.severity}
                          </Badge>
                          <span className={`text-[11px] font-medium flex items-center gap-1 ${stat.color}`}>
                            {stat.icon}
                            {inc.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Activity Feed */}
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl border-border/80">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-500" />
                AI Activity
              </CardTitle>
              <Link href="/dashboard/predictions" className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Details <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2">
                {aiFeed.map((ai) => (
                  <div
                    key={ai.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-transparent hover:border-border transition-all"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={`p-1.5 rounded-lg ${ai.status === 'completed' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        <Zap className={`w-3.5 h-3.5 ${ai.status === 'completed' ? 'text-emerald-500' : 'text-rose-500'}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">Job #{ai.id}</p>
                        <Badge variant={ai.status === 'completed' ? 'outline' : 'destructive'} className="text-[9px] uppercase tracking-wider h-5">
                          {ai.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground font-medium">
                        <span>Incident #{ai.incident_id}</span>
                        <span className="text-border">|</span>
                        <span>{ai.model_version}</span>
                        <span className="text-border">|</span>
                        <span>{ai.processing_time_ms}ms</span>
                      </div>
                      {ai.edges_affected > 0 && (
                        <p className="text-[11px] text-primary/80 font-semibold mt-1">
                          {ai.edges_affected} road segments analyzed
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

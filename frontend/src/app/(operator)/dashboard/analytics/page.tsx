'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { BarChart3, TrendingUp, AlertOctagon, Clock, ActivitySquare, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const SEVERITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#eab308',
  high: '#f97316',
  critical: '#f43f5e',
};

const TYPE_COLORS: Record<string, string> = {
  accident: '#f43f5e',
  congestion: '#f97316',
  construction: '#eab308',
  weather: '#3b82f6',
  other: '#6b7280',
};

interface Incident {
  id: number;
  type: string;
  severity: string;
  status: string;
  created_at: string;
}

interface Prediction {
  id: number;
  status: string;
  processing_time_ms: number;
  prediction_edges: { confidence: number }[];
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incRes, predRes] = await Promise.allSettled([
        api.get('/incidents?per_page=100'),
        api.get('/predictions?per_page=100'),
      ]);
      if (incRes.status === 'fulfilled') setIncidents(incRes.value.data.data || []);
      if (predRes.status === 'fulfilled') setPredictions(predRes.value.data.data || []);
    } catch { /* keep empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // KPIs from real data
  const kpis = useMemo(() => {
    const openCount = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length;
    const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
    const completedPreds = predictions.filter(p => p.status === 'completed');
    const avgTime = completedPreds.length > 0
      ? Math.round(completedPreds.reduce((s, p) => s + (p.processing_time_ms || 0), 0) / completedPreds.length)
      : 0;
    const resolutionRate = incidents.length > 0 ? Math.round((resolvedCount / incidents.length) * 100) : 0;
    return { openCount, resolvedCount, avgTime, resolutionRate, total: incidents.length };
  }, [incidents, predictions]);

  // Severity pie chart from real data
  const severityData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(i => { counts[i.severity] = (counts[i.severity] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: t(`enums.incidentSeverity.${name}`),
      value,
      color: SEVERITY_COLORS[name] || '#6b7280',
    }));
  }, [incidents, t]);

  // Type bar chart from real data
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: t(`enums.incidentType.${name}`),
      value,
      fill: TYPE_COLORS[name] || '#6b7280',
    }));
  }, [incidents, t]);

  // Density trend from incidents created_at (group by hour)
  const trendData = useMemo(() => {
    const hourBuckets: Record<string, { density: number; incidents: number }> = {};
    for (let h = 0; h < 24; h += 4) {
      const key = `${String(h).padStart(2, '0')}:00`;
      hourBuckets[key] = { density: 0, incidents: 0 };
    }
    incidents.forEach(inc => {
      const hour = new Date(inc.created_at).getHours();
      const bucket = `${String(Math.floor(hour / 4) * 4).padStart(2, '0')}:00`;
      if (hourBuckets[bucket]) {
        hourBuckets[bucket].incidents += 1;
        hourBuckets[bucket].density += inc.severity === 'critical' ? 25 : inc.severity === 'high' ? 18 : inc.severity === 'medium' ? 10 : 5;
      }
    });
    return Object.entries(hourBuckets).map(([time, data]) => ({ time, ...data }));
  }, [incidents]);

  const tooltipStyle = {
    contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px', color: 'var(--foreground)' },
    labelStyle: { fontWeight: 'bold', color: 'var(--foreground)' },
    itemStyle: { color: 'var(--foreground)' },
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.trafficAnalytics')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('op.analyticsSubtitle')}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('op.refreshData')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/40 backdrop-blur-md shadow-lg border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" /> {t('op.totalIncidents')}
            </CardDescription>
            <CardTitle className="text-4xl font-heading text-rose-500">
              {kpis.total}<span className="text-lg text-muted-foreground font-normal ml-2">{t('op.events')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">
              <span className="text-amber-500 font-bold">{kpis.openCount}</span> {t('op.activeNow')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md shadow-lg border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> {t('op.avgProcessingTime')}
            </CardDescription>
            <CardTitle className="text-4xl font-heading text-amber-500">
              {kpis.avgTime}<span className="text-lg text-muted-foreground font-normal ml-2">ms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">
              {t('op.aiPredictionSpeed')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md shadow-lg border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <ActivitySquare className="w-3.5 h-3.5 text-emerald-500" /> {t('op.resolutionRate')}
            </CardDescription>
            <CardTitle className="text-4xl font-heading text-emerald-500">
              {kpis.resolutionRate}<span className="text-lg text-muted-foreground font-normal ml-2">%</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> {kpis.resolvedCount}/{kpis.total} {t('op.resolved')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md shadow-lg border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" /> {t('op.aiSessions')}
            </CardDescription>
            <CardTitle className="text-4xl font-heading text-blue-500">
              {predictions.length}<span className="text-lg text-muted-foreground font-normal ml-2">{t('op.runs')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">
              <span className="text-emerald-500 font-bold">{predictions.filter(p => p.status === 'completed').length}</span> {t('op.completedRuns')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Density Trend (Area) */}
        <Card className="bg-card/50 backdrop-blur-xl border-border shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-heading">{t('op.densityForecast')}</CardTitle>
            <CardDescription>{t('op.predictedPattern')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="density" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDensity)" name={t('op.densityForecast')} />
                <Area type="monotone" dataKey="incidents" stroke="#f97316" strokeWidth={2} fillOpacity={0} name={t('op.trafficIncidents')} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Pie */}
        <Card className="bg-card/50 backdrop-blur-xl border-border shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-heading">{t('op.incidentsBySeverity')}</CardTitle>
            <CardDescription>{t('op.weeklyMetrics')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full flex items-center justify-center">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incidents by Type (Bar) */}
      <Card className="bg-card/50 backdrop-blur-xl border-border shadow-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-heading">{t('op.incidentsByType')}</CardTitle>
          <CardDescription>{t('op.breakdownByCategory')}</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] w-full">
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 11, fill: 'var(--muted-foreground)'}} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" name={t('op.totalIncidents')} radius={[6, 6, 0, 0]} barSize={40}>
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

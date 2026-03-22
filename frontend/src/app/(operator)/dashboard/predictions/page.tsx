'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import {
  Brain, CheckCircle, XCircle, Clock, Activity, ChevronRight,
  BarChart2, Cpu, Zap, TrendingUp, Percent, Play, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface PredictionEdge {
  edge_id: number;
  time_horizon_minutes: number;
  predicted_density: number;
  confidence: number;
  severity: string;
  edge?: { name: string };
}

interface Prediction {
  id: number;
  incident_id: number;
  model_version: string;
  status: string;
  processing_time_ms: number;
  created_at: string;
  prediction_edges: PredictionEdge[];
}

interface ModelInfo {
  model_name: string;
  architecture?: string;
  status: string;
  metrics?: { mae?: number; rmse?: number; r2?: number };
  framework?: string;
  message?: string;
}

const severityColors: Record<string, string> = {
  low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
};

const severityBarColors: Record<string, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]',
};

const chartBarColors: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#f43f5e',
};

export default function PredictionsPage() {
  const { t } = useTranslation();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prediction | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    api.get('/predictions')
      .then((res) => setPredictions(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));

    // Fetch AI model info
    const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';
    fetch(`${aiUrl}/api/model-info`)
      .then(res => res.json())
      .then(setModelInfo)
      .catch(() => setModelInfo({ model_name: 'GNN-BFS-v1.0', status: 'fallback', message: 'AI service unavailable' }));
  }, []);

  // KPI calculations
  const kpis = useMemo(() => {
    if (predictions.length === 0) return { total: 0, successRate: 0, avgConfidence: 0, avgTime: 0 };
    const completed = predictions.filter(p => p.status === 'completed');
    const allEdges = predictions.flatMap(p => p.prediction_edges || []);
    const avgConfidence = allEdges.length > 0
      ? allEdges.reduce((sum, e) => sum + e.confidence, 0) / allEdges.length
      : 0;
    const avgTime = completed.length > 0
      ? completed.reduce((sum, p) => sum + (p.processing_time_ms || 0), 0) / completed.length
      : 0;
    return {
      total: predictions.length,
      successRate: predictions.length > 0 ? (completed.length / predictions.length) * 100 : 0,
      avgConfidence: avgConfidence * 100,
      avgTime: Math.round(avgTime),
    };
  }, [predictions]);

  // Chart data for selected prediction
  const chartData = useMemo(() => {
    if (!selected) return [];
    return (selected.prediction_edges || []).map(e => ({
      name: `#${e.edge_id}`,
      density: Math.round(e.predicted_density * 100),
      confidence: Math.round(e.confidence * 100),
      severity: e.severity,
    }));
  }, [selected]);

  const handleTrigger = async () => {
    setTriggering(true);
    try {
      await api.post('/predictions/trigger');
      const res = await api.get('/predictions');
      setPredictions(res.data.data || []);
    } catch (e) {
      console.error('Trigger failed:', e);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.aiPredictionsTitle')}</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {t('op.aiSubtitle')}
            </p>
          </div>
        </div>
        <Button onClick={handleTrigger} disabled={triggering} size="sm" className="gap-2">
          {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {t('op.runPrediction')}
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('op.totalPredictions'), value: kpis.total, icon: <Brain className="w-4 h-4 text-blue-500" />, color: 'text-blue-500' },
          { label: t('op.successRate'), value: `${kpis.successRate.toFixed(0)}%`, icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, color: 'text-emerald-500' },
          { label: t('op.avgConfidence'), value: `${kpis.avgConfidence.toFixed(1)}%`, icon: <Percent className="w-4 h-4 text-purple-500" />, color: 'text-purple-500' },
          { label: t('op.avgProcessingTime'), value: `${kpis.avgTime}ms`, icon: <Zap className="w-4 h-4 text-amber-500" />, color: 'text-amber-500' },
        ].map((kpi, i) => (
          <Card key={i} className="bg-card/40 border-border/50 hover:border-border transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-secondary/50 border border-border/50">{kpi.icon}</div>
              <div>
                <div className={`text-2xl font-heading font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{kpi.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Info Card */}
      {modelInfo && (
        <Card className="bg-card/40 border-border/50">
          <CardContent className="p-4 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-primary" />
              <div>
                <span className="text-sm font-bold">{modelInfo.model_name}</span>
                {modelInfo.architecture && (
                  <span className="text-xs text-muted-foreground ml-2">({modelInfo.architecture})</span>
                )}
              </div>
            </div>
            <Badge variant={modelInfo.status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${modelInfo.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {modelInfo.status}
            </Badge>
            {modelInfo.framework && (
              <span className="text-xs text-muted-foreground">
                {t('op.framework')}: <span className="font-medium text-foreground">{modelInfo.framework}</span>
              </span>
            )}
            {modelInfo.metrics?.mae !== undefined && (
              <span className="text-xs text-muted-foreground">
                MAE: <span className="font-bold text-foreground">{modelInfo.metrics.mae.toFixed(4)}</span>
              </span>
            )}
            {modelInfo.metrics?.rmse !== undefined && (
              <span className="text-xs text-muted-foreground">
                RMSE: <span className="font-bold text-foreground">{modelInfo.metrics.rmse.toFixed(4)}</span>
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* List (Left Panel) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col h-[calc(100vh-420px)]">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs">{t('op.executionHistory')}</h3>
            <span className="text-xs font-medium text-muted-foreground">{t('op.sessions', { n: String(predictions.length) })}</span>
          </div>

          <ScrollArea className="h-full pr-4 pb-6">
            <div className="space-y-3">
              {loading ? (
                <Card className="p-12 bg-card/30 flex flex-col items-center justify-center gap-3 border-dashed">
                  <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground font-medium">{t('op.loadingHistory')}</span>
                </Card>
              ) : predictions.length === 0 ? (
                <Card className="p-10 text-center bg-card/30 border-dashed text-muted-foreground font-medium">
                  {t('op.noPredictions')}
                </Card>
              ) : predictions.map((pred) => {
                const isSelected = selected?.id === pred.id;
                return (
                  <Card
                    key={pred.id}
                    onClick={() => setSelected(pred)}
                    className={`cursor-pointer transition-all duration-200 border group ${
                      isSelected
                        ? 'bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]'
                        : 'bg-card/40 hover:bg-card hover:border-border/80'
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className={`w-4 h-4 ${isSelected ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                          <span className={`font-heading font-bold text-sm ${isSelected ? 'text-primary' : ''}`}>
                            Job #{pred.id}
                          </span>
                        </div>
                        <Badge variant={pred.status === 'completed' ? 'outline' : 'destructive'} className="text-[10px] uppercase tracking-wider gap-1">
                          {pred.status === 'completed' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3" />}
                          {t(`enums.predictionStatus.${pred.status}`)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{t('op.referenceSource')}</span>
                          <span className="text-xs font-medium">{t('op.incidentRef', { id: String(pred.incident_id) })}</span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{t('op.modelEngine')}</span>
                          <span className="text-xs font-medium truncate">{pred.model_version}</span>
                        </div>

                        <div className="col-span-2 flex items-center justify-between mt-1 pt-2 border-t border-border/50">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {t('op.runtime', { ms: String(pred.processing_time_ms) })}
                          </span>

                          <div className={`p-1 rounded-full transition-transform ${isSelected ? 'translate-x-1 text-primary' : 'text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground'}`}>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Detail (Right Panel) */}
        <div className="lg:col-span-7 h-[calc(100vh-420px)] flex flex-col">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs">{t('op.modelOutput')}</h3>
          </div>

          <Card className="flex-1 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
            {selected ? (
              <div className="flex flex-col h-full">
                {/* Detail Header */}
                <CardHeader className="p-6 border-b border-border/50 bg-card/80">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    <CardTitle className="font-heading font-bold text-lg">{t('op.forecastDetail', { id: String(selected.id) })}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {t('op.forecastDesc', { n: String(selected.prediction_edges?.length || 0) })}
                  </p>
                </CardHeader>

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6 pr-4">
                    {/* Density Chart */}
                    {chartData.length > 0 && (
                      <Card className="p-4 bg-background/50 border-border/50">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {t('op.densityChart')}
                        </h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={chartData} barSize={20}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                            <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" domain={[0, 100]} unit="%" />
                            <Tooltip
                              contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                              labelStyle={{ fontWeight: 'bold' }}
                            />
                            <Bar dataKey="density" name="Density" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell key={index} fill={chartBarColors[entry.severity] || '#6b7280'} />
                              ))}
                            </Bar>
                            <Bar dataKey="confidence" name="Confidence" radius={[4, 4, 0, 0]} fill="#818cf8" opacity={0.5} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    )}

                    {/* Edges Detail List */}
                    {selected.prediction_edges?.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground font-medium">{t('op.noTelemetry')}</div>
                    ) : selected.prediction_edges?.map((pe, i) => (
                      <Card key={i} className="p-5 bg-card/50 hover:border-muted-foreground/50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-heading font-bold">Node #{pe.edge_id}</span>
                            <span className="text-xs text-muted-foreground font-medium">{pe.edge?.name || t('op.adjacentLocation')}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${severityColors[pe.severity] || 'text-muted-foreground bg-muted border-muted'}`}>
                            {t(`enums.incidentSeverity.${pe.severity}`)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{t('op.timeHorizon')}</div>
                            <div className="font-heading font-bold text-foreground">+{pe.time_horizon_minutes} <span className="text-xs text-muted-foreground font-body">min</span></div>
                          </div>

                          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{t('op.projectedLoad')}</div>
                            <div className="font-heading font-bold text-foreground">{(pe.predicted_density * 100).toFixed(1)}<span className="text-xs text-muted-foreground font-body">%</span></div>
                          </div>

                          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{t('op.aiConfidence')}</div>
                            <div className="font-heading font-bold text-foreground">{(pe.confidence * 100).toFixed(0)}<span className="text-xs text-muted-foreground font-body">%</span></div>
                          </div>
                        </div>

                        {/* Density bar */}
                        <div className="relative pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">{t('op.congestionTrajectory')}</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary border border-border overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${severityBarColors[pe.severity] || 'bg-muted-foreground'}`}
                              style={{ width: `${Math.min(pe.predicted_density * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-10 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                  <BarChart2 className="w-6 h-6 opacity-50" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{t('op.noSessionSelected')}</p>
                  <p className="text-sm">{t('op.selectSessionHint')}</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

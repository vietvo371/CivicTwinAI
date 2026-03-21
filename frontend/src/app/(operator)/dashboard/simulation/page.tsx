'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  FlaskConical, Play, RotateCcw, MapPin, AlertTriangle,
  Gauge, TrendingDown, TrendingUp, Clock, Layers, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const TrafficMap = dynamic(() => import('@/components/TrafficMap'), { ssr: false });

interface SimulationResult {
  id: number;
  status: 'running' | 'completed';
  duration_ms: number;
  affected_edges: number;
  before_avg_density: number;
  after_avg_density: number;
  segments: { name: string; before: number; after: number; change: number }[];
}

const DEMO_RESULT: SimulationResult = {
  id: 1,
  status: 'completed',
  duration_ms: 2340,
  affected_edges: 18,
  before_avg_density: 0.42,
  after_avg_density: 0.71,
  segments: [
    { name: 'Cau Sai Gon', before: 0.35, after: 0.92, change: +163 },
    { name: 'Nguyen Huu Canh', before: 0.48, after: 0.78, change: +62 },
    { name: 'Ham Thu Thiem', before: 0.29, after: 0.65, change: +124 },
    { name: 'Vo Van Kiet (Q.1)', before: 0.55, after: 0.68, change: +24 },
    { name: 'Xa Lo Ha Noi', before: 0.41, after: 0.59, change: +44 },
  ],
};

function getDensityColor(d: number) {
  if (d < 0.3) return 'text-emerald-500';
  if (d < 0.6) return 'text-amber-500';
  if (d < 0.8) return 'text-orange-500';
  return 'text-rose-500';
}

function getDensityBar(d: number) {
  if (d < 0.3) return 'bg-emerald-500';
  if (d < 0.6) return 'bg-amber-500';
  if (d < 0.8) return 'bg-orange-500';
  return 'bg-rose-500';
}

export default function SimulationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleRunSimulation = () => {
    setIsRunning(true);
    setResult(null);
    // Simulate AI processing delay
    setTimeout(() => {
      setResult(DEMO_RESULT);
      setIsRunning(false);
    }, 3000);
  };

  const handleReset = () => {
    setResult(null);
    setIsRunning(false);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <FlaskConical className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Traffic Simulation</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Run "what-if" scenarios to predict traffic impact before it happens
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-500" />
                Scenario Parameters
              </CardTitle>
              <CardDescription>Configure simulation inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Incident Type</label>
                <Select defaultValue="accident">
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accident">Vehicle Accident</SelectItem>
                    <SelectItem value="flood">Flooding / Weather</SelectItem>
                    <SelectItem value="construction">Road Construction</SelectItem>
                    <SelectItem value="event">Large Public Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Severity Level</label>
                <Select defaultValue="high">
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Impact</SelectItem>
                    <SelectItem value="medium">Medium Impact</SelectItem>
                    <SelectItem value="high">High Impact</SelectItem>
                    <SelectItem value="critical">Critical / Full Block</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location (Area)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="e.g. Cau Sai Gon" className="pl-10 bg-background/50" defaultValue="Cau Sai Gon, Q.2" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prediction Horizon</label>
                <Select defaultValue="30">
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleRunSimulation}
                  disabled={isRunning}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                >
                  {isRunning ? (
                    <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Play className="w-4 h-4" /> Run Simulation</span>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isRunning} className="px-3">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Summary */}
          {result && (
            <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-violet-500/30 animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-500" />
                    Result Summary
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-emerald-500 border-emerald-500/30">
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-background/50 p-3 rounded-lg border border-border/50 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Edges Affected</p>
                    <p className="text-2xl font-heading font-black text-violet-500">{result.affected_edges}</p>
                  </div>
                  <div className="bg-background/50 p-3 rounded-lg border border-border/50 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Runtime</p>
                    <p className="text-2xl font-heading font-black text-blue-500">{(result.duration_ms / 1000).toFixed(1)}s</p>
                  </div>
                </div>
                <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Avg. Density Change</p>
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Before</p>
                      <p className={`text-xl font-heading font-bold ${getDensityColor(result.before_avg_density)}`}>
                        {(result.before_avg_density * 100).toFixed(0)}%
                      </p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-rose-500 mb-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">After</p>
                      <p className={`text-xl font-heading font-bold ${getDensityColor(result.after_avg_density)}`}>
                        {(result.after_avg_density * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Map + Segment Details */}
        <div className="lg:col-span-8 space-y-6">
          {/* Map Preview */}
          <Card className="bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden border-border/80">
            <CardContent className="p-3">
              <div className="h-[350px] rounded-xl overflow-hidden border border-border/50 relative">
                <TrafficMap isPublic />
                {isRunning && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                    <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    <div className="text-center">
                      <p className="font-heading font-bold text-lg">Simulating Impact...</p>
                      <p className="text-sm text-muted-foreground mt-1">GNN model processing spatial graph</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Segment-level Results */}
          {result && (
            <Card className="bg-card/40 backdrop-blur-xl shadow-2xl border-border/80 animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-orange-500" />
                  Segment-Level Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-3">
                  {result.segments.map((seg, i) => (
                    <div key={i} className="bg-background/50 border border-border/50 rounded-xl p-4 hover:border-border transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-400" />
                          <span className="font-bold text-sm">{seg.name}</span>
                        </div>
                        <Badge className={`text-[10px] font-bold uppercase tracking-wider ${seg.change > 100 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : seg.change > 50 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'} border`}>
                          +{seg.change}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Before</p>
                          <p className={`text-lg font-heading font-bold ${getDensityColor(seg.before)}`}>
                            {(seg.before * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">After</p>
                          <p className={`text-lg font-heading font-bold ${getDensityColor(seg.after)}`}>
                            {(seg.after * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-secondary border border-border overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${getDensityBar(seg.after)}`} style={{ width: `${seg.after * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Brain, CheckCircle, XCircle, Clock, Activity, ChevronRight, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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

const severityColors: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', 
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20', 
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20', 
  critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
};

const severityBarColors: Record<string, string> = {
  low: 'bg-emerald-500', 
  medium: 'bg-amber-500', 
  high: 'bg-orange-500', 
  critical: 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]',
};

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prediction | null>(null);

  useEffect(() => {
    api.get('/predictions')
      .then((res) => setPredictions(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">AI Predictions</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Mô phỏng & Dự báo tình trạng giao thông
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* List (Left Panel) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col h-[calc(100vh-220px)]">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs">Lịch sử chạy AI</h3>
            <span className="text-xs font-medium text-muted-foreground">{predictions.length} phiên</span>
          </div>
          
          <ScrollArea className="h-full pr-4 pb-6">
            <div className="space-y-3">
              {loading ? (
                <Card className="p-12 bg-card/30 flex flex-col items-center justify-center gap-3 border-dashed">
                  <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground font-medium">Đang tải lịch sử...</span>
                </Card>
              ) : predictions.length === 0 ? (
                <Card className="p-10 text-center bg-card/30 border-dashed text-muted-foreground font-medium">
                  Chưa có phiên dự đoán nào.
                </Card>
              ) : predictions.map((pred) => {
                const isSelected = selected?.id === pred.id;
                return (
                  <Card 
                    key={pred.id} 
                    onClick={() => setSelected(pred)}
                    className={`cursor-pointer transition-all duration-200 border group ${
                      isSelected 
                        ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                        : 'bg-card/40 hover:bg-card hover:border-border/80'
                    }`}
                  >
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className={`w-4 h-4 ${isSelected ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                          <span className={`font-heading font-bold text-sm ${isSelected ? 'text-primary' : ''}`}>
                            Phiên #{pred.id}
                          </span>
                        </div>
                        <Badge variant={pred.status === 'completed' ? 'outline' : 'destructive'} className="text-[10px] uppercase tracking-wider gap-1">
                          {pred.status === 'completed' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3" />}
                          {pred.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Sự cố tham chiếu</span>
                          <span className="text-xs font-medium">Incident #{pred.incident_id}</span>
                        </div>
                        
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Model</span>
                          <span className="text-xs font-medium truncate">{pred.model_version}</span>
                        </div>

                        <div className="col-span-2 flex items-center justify-between mt-1 pt-2 border-t border-border/50">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" /> 
                            {pred.processing_time_ms}ms runtime
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
        <div className="lg:col-span-7 h-[calc(100vh-220px)] flex flex-col">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs">Phân tích chi tiết Model Output</h3>
          </div>

          <Card className="flex-1 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
            {selected ? (
              <div className="flex flex-col h-full">
                {/* Detail Header */}
                <CardHeader className="p-6 border-b border-border/50 bg-card/80">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    <CardTitle className="font-heading font-bold text-lg">Chi tiết dự báo #{selected.id}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Hệ thống phân tích tác động giao thông trên <span className="text-primary">{selected.prediction_edges?.length || 0}</span> đoạn đường lân cận.
                  </p>
                </CardHeader>

                {/* Edges List */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4 pr-4">
                    {selected.prediction_edges?.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground font-medium">Không có dữ liệu chi tiết cho dự báo này.</div>
                    ) : selected.prediction_edges?.map((pe, i) => (
                      <Card key={i} className="p-5 bg-card/50 hover:border-muted-foreground/50 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-heading font-bold">Edge #{pe.edge_id}</span>
                            <span className="text-xs text-muted-foreground font-medium">{pe.edge?.name || 'Vị trí lân cận'}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${severityColors[pe.severity] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                            {pe.severity}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Time Horizon</div>
                            <div className="font-heading font-bold text-foreground">+{pe.time_horizon_minutes} <span className="text-xs text-muted-foreground font-body">phút</span></div>
                          </div>
                          
                          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">Dự báo Mật độ</div>
                            <div className="font-heading font-bold text-foreground">{(pe.predicted_density * 100).toFixed(1)}<span className="text-xs text-muted-foreground font-body">%</span></div>
                          </div>
                          
                          <div className="bg-background/50 p-3 rounded-lg border border-border/50">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">AI Confidence</div>
                            <div className="font-heading font-bold text-foreground">{(pe.confidence * 100).toFixed(0)}<span className="text-xs text-muted-foreground font-body">%</span></div>
                          </div>
                        </div>
                        
                        {/* Density bar visualization */}
                        <div className="relative pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Traffic Load Projection</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary border border-border overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${severityBarColors[pe.severity] || 'bg-slate-500'}`}
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
                  <p className="font-semibold text-foreground">Chưa chọn báo cáo</p>
                  <p className="text-sm">Vui lòng chọn một phiên AI ở menu bên trái để xem kết quả siêu dữ liệu (metadata).</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

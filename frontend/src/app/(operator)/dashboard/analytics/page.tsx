'use client';

import { BarChart3, TrendingUp, AlertTriangle, Lightbulb, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AnalyticsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Phân tích giao thông</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              Báo cáo đa chiều & Dự báo xu hướng dài hạn
            </p>
          </div>
        </div>
        
        <Badge variant="outline" className="px-4 py-2 bg-background/50 text-sm font-medium gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Hôm nay, {new Date().toLocaleDateString('vi-VN')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[
          { 
            label: 'Sự cố phát sinh (24h)', 
            value: '—', 
            color: 'text-amber-500', 
            trend: '+12%', 
            trendUp: true,
            icon: AlertTriangle,
            bgContainer: 'bg-amber-500/10 border-amber-500/20'
          },
          { 
            label: 'Dự đoán chính xác', 
            value: '—', 
            color: 'text-emerald-500', 
            trend: '+5.4%', 
            trendUp: true,
            icon: CheckCircle,
            bgContainer: 'bg-emerald-500/10 border-emerald-500/20'
          },
          { 
            label: 'Đề xuất chờ duyệt', 
            value: '—', 
            color: 'text-blue-500', 
            trend: '-2', 
            trendUp: false,
            icon: Lightbulb,
            bgContainer: 'bg-blue-500/10 border-blue-500/20'
          },
        ].map((kpi, idx) => (
          <Card 
            key={idx} 
            className="group relative overflow-hidden bg-card/60 backdrop-blur-xl hover:border-muted-foreground/50 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kpi.bgContainer}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md bg-background/50 ${kpi.trendUp ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                  {kpi.trendUp && <TrendingUp className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{kpi.label}</div>
                <div className={`text-4xl font-heading font-bold ${kpi.color}`}>{kpi.value}</div>
              </div>
              
              {/* Ambient Background Glow */}
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${kpi.bgContainer.split(' ')[0]}`} />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="w-full min-h-[400px] flex flex-col items-center justify-center gap-4 bg-card/30 backdrop-blur-xl p-8 text-center relative overflow-hidden border-dashed">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2 z-10 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
          <BarChart3 className="w-8 h-8 text-indigo-400" />
        </div>
        <div className="z-10 space-y-2 max-w-md mx-auto">
          <CardTitle className="text-xl font-heading">Không gian trực quan hóa (Phase 2)</CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">
            Hệ thống biểu đồ tương tác, phân tích Time-series (Line charts), Mức độ ùn tắc (Bar charts) và Báo cáo tự động sẽ được triển khai trong bản cập nhật tới.
          </p>
        </div>
      </Card>
    </div>
  );
}

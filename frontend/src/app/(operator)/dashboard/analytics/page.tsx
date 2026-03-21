'use client';

import { useTranslation } from '@/lib/i18n';
import { BarChart3, TrendingUp, AlertOctagon, Clock, ActivitySquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const mockTrendyData = [
  { time: '00:00', density: 10, incidents: 0 },
  { time: '04:00', density: 15, incidents: 1 },
  { time: '08:00', density: 85, incidents: 4 },
  { time: '12:00', density: 60, incidents: 2 },
  { time: '16:00', density: 95, incidents: 7 },
  { time: '20:00', density: 40, incidents: 1 },
];

const mockSeverityData = [
  { name: 'Critical', value: 4, color: '#f43f5e' },
  { name: 'High', value: 12, color: '#f97316' },
  { name: 'Medium', value: 25, color: '#eab308' },
];

export default function AnalyticsPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">{t('op.trafficAnalytics')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('op.analyticsSubtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-card/40 backdrop-blur-md shadow-lg border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500" /> {t('op.totalBottlenecks')}
            </CardDescription>
            <CardTitle className="text-4xl font-heading text-rose-500">24<span className="text-lg text-muted-foreground font-normal ml-2">{t('op.nodes')}</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">
              <span className="text-rose-500 font-bold">+12%</span> {t('op.vsLastWeek')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md shadow-lg border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> {t('op.avgDelayTime')}
            </CardDescription>
            <CardTitle className="text-4xl font-heading text-amber-500">18<span className="text-lg text-muted-foreground font-normal ml-2">{t('op.mins')}</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground">
              <span className="text-emerald-500 font-bold">-2.5 {t('op.mins')}</span> {t('op.vsYesterday')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md shadow-lg border-border/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <ActivitySquare className="w-3.5 h-3.5 text-emerald-500" /> {t('op.resolutionRate')}
            </CardDescription>
            <CardTitle className="text-4xl font-heading text-emerald-500">92<span className="text-lg text-muted-foreground font-normal ml-2">%</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> {t('op.optimalPerformance')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-heading">{t('op.densityForecast')}</CardTitle>
            <CardDescription>{t('op.predictedPattern')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="density" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorDensity)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-heading">{t('op.incidentsBySeverity')}</CardTitle>
            <CardDescription>{t('op.weeklyMetrics')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockSeverityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mockSeverityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

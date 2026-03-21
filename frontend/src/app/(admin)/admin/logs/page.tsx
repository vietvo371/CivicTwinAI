'use client';

import { useState } from 'react';
import {
  ActivitySquare, Search, Filter, Clock, User, Shield,
  Database, AlertTriangle, Settings, LogIn, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  actor: string;
  action: string;
  resource: string;
  ip: string;
}

const DEMO_LOGS: LogEntry[] = [
  { id: 1, timestamp: '2026-03-21 08:55:12', level: 'info', actor: 'admin@civictwin.local', action: 'User role updated', resource: 'users/7', ip: '192.168.1.10' },
  { id: 2, timestamp: '2026-03-21 08:50:03', level: 'info', actor: 'system', action: 'AI Prediction triggered', resource: 'predictions/create', ip: '10.0.0.1' },
  { id: 3, timestamp: '2026-03-21 08:48:45', level: 'warning', actor: 'operator_q1@civictwin.local', action: 'Recommendation rejected', resource: 'recommendations/5/reject', ip: '192.168.1.22' },
  { id: 4, timestamp: '2026-03-21 08:30:10', level: 'info', actor: 'system', action: 'Database backup completed', resource: 'system/backup', ip: '10.0.0.1' },
  { id: 5, timestamp: '2026-03-21 08:15:32', level: 'error', actor: 'system', action: 'Sensor connection timeout', resource: 'sensors/SENSOR-PN-001', ip: '10.0.0.5' },
  { id: 6, timestamp: '2026-03-21 07:45:00', level: 'info', actor: 'citizen01@gmail.com', action: 'Incident report submitted', resource: 'incidents/create', ip: '42.118.xxx.xxx' },
  { id: 7, timestamp: '2026-03-21 07:30:22', level: 'info', actor: 'admin@civictwin.local', action: 'System settings updated', resource: 'settings/ai-engine', ip: '192.168.1.10' },
  { id: 8, timestamp: '2026-03-21 07:00:00', level: 'debug', actor: 'system', action: 'Scheduled sensor data ingestion', resource: 'pipeline/ingest', ip: '10.0.0.1' },
  { id: 9, timestamp: '2026-03-21 06:30:15', level: 'info', actor: 'emergency@civictwin.local', action: 'Priority route requested', resource: 'priority-route/create', ip: '192.168.2.50' },
  { id: 10, timestamp: '2026-03-21 06:00:00', level: 'warning', actor: 'system', action: 'High memory usage detected (87%)', resource: 'system/monitor', ip: '10.0.0.1' },
];

const levelStyle: Record<string, { color: string; bg: string }> = {
  info: { color: 'text-blue-500', bg: 'bg-blue-500' },
  warning: { color: 'text-amber-500', bg: 'bg-amber-500' },
  error: { color: 'text-rose-500', bg: 'bg-rose-500' },
  debug: { color: 'text-slate-400', bg: 'bg-slate-400' },
};

export default function LogsPage() {
  const [levelFilter, setLevelFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = DEMO_LOGS.filter(log => {
    const matchLevel = levelFilter === 'all' || log.level === levelFilter;
    const matchSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || log.actor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchSearch;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <ActivitySquare className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">System Logs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Audit trails, system events & security monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {['info', 'warning', 'error'].map(level => {
            const count = DEMO_LOGS.filter(l => l.level === level).length;
            const style = levelStyle[level];
            return (
              <Badge key={level} variant="outline" className={`text-[10px] uppercase tracking-wider gap-1 ${style.color}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${style.bg}`} /> {count}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by action or actor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/80 backdrop-blur-md"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px] bg-card/80 backdrop-blur-md">
            <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder="Level" /></div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log Entries */}
      <Card className="bg-card/40 backdrop-blur-xl shadow-2xl border-border/80">
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {filtered.map((log) => {
              const style = levelStyle[log.level];
              return (
                <div key={log.id} className="p-4 hover:bg-accent/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    {/* Level Indicator */}
                    <div className="mt-1 shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${style.bg} ${log.level === 'error' ? 'animate-pulse' : ''}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{log.action}</p>
                        <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${style.color}`}>
                          {log.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-[11px] text-muted-foreground font-medium flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {log.actor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" /> {log.resource}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {log.timestamp}
                        </span>
                        <span className="text-muted-foreground/50 font-mono">{log.ip}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-16 text-center text-muted-foreground">
                <ActivitySquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No log entries match your filters.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import {
  AlertTriangle, Clock, MapPin, ChevronRight, Siren,
  Phone, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DEMO_INCIDENTS = [
  { id: 1, title: 'Va cham Container tren Cau Rong', location: 'Cau Rong, Q. Son Tra', severity: 'critical', status: 'active', time: '08:15', casualties: 2, vehicles: 4, responders: 3 },
  { id: 2, title: 'Ngap nuoc duong Nguyen Huu Tho', location: 'Nguyen Huu Tho, Q. Cam Le', severity: 'high', status: 'active', time: '07:30', casualties: 0, vehicles: 0, responders: 2 },
  { id: 3, title: 'Chay nha gan cho Han', location: 'Tran Phu, Q. Hai Chau', severity: 'critical', status: 'responding', time: '08:40', casualties: 0, vehicles: 0, responders: 5 },
];

const severityStyle: Record<string, string> = {
  low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
};

export default function EmergencyIncidentsPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-rose-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Siren className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Active Incidents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {DEMO_INCIDENTS.length} incidents requiring emergency response
            </p>
          </div>
        </div>
      </div>

      {/* Incident Cards */}
      <div className="space-y-4">
        {DEMO_INCIDENTS.map((inc) => {
          const sev = severityStyle[inc.severity] || severityStyle.medium;
          return (
            <Card key={inc.id} className={`bg-card/50 backdrop-blur-xl border-border/80 hover:border-rose-500/30 transition-all ${inc.severity === 'critical' ? 'border-l-4 border-l-rose-500' : ''}`}>
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${sev}`}>
                        {inc.severity}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider gap-1 text-blue-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> {inc.status}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-heading font-bold">{inc.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {inc.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {inc.time}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3 shrink-0">
                    {inc.casualties > 0 && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center min-w-[80px]">
                        <p className="text-xl font-heading font-black text-rose-500">{inc.casualties}</p>
                        <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest">Casualties</p>
                      </div>
                    )}
                    {inc.vehicles > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center min-w-[80px]">
                        <p className="text-xl font-heading font-black text-amber-500">{inc.vehicles}</p>
                        <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Vehicles</p>
                      </div>
                    )}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center min-w-[80px]">
                      <p className="text-xl font-heading font-black text-blue-500">{inc.responders}</p>
                      <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Responders</p>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-sm font-bold transition-colors shadow-lg shadow-rose-500/20">
                    <Phone className="w-4 h-4" /> Dispatch Unit
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-sm font-semibold transition-colors border border-border">
                    <Shield className="w-4 h-4" /> Request Backup
                  </button>
                  <button className="ml-auto flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                    Full Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

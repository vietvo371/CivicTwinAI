'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, Users, Database, Settings, ActivitySquare,
  TrendingUp, Clock, Shield, ChevronRight, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DEMO_STATS = {
  totalUsers: 156,
  activeOperators: 8,
  totalNodes: 1247,
  totalEdges: 3891,
  systemUptime: '99.97%',
  lastBackup: '2 hours ago',
};

const QUICK_LINKS = [
  { href: '/admin/users', icon: Users, label: 'User Management', description: 'Manage accounts, roles & permissions', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { href: '/admin/master', icon: Database, label: 'Master Data', description: 'Nodes, edges, sensors & map topology', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { href: '/admin/settings', icon: Settings, label: 'System Settings', description: 'Configure system parameters', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { href: '/admin/logs', icon: ActivitySquare, label: 'System Logs', description: 'Audit trails & activity logs', color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
];

const RECENT_ACTIVITIES = [
  { id: 1, action: 'User "operator_hcm_01" role updated to traffic_operator', time: '5 mins ago', type: 'user' },
  { id: 2, action: 'System backup completed successfully', time: '2 hours ago', type: 'system' },
  { id: 3, action: '12 new sensor nodes added to District 7 topology', time: '4 hours ago', type: 'data' },
  { id: 4, action: 'AI Model GNN-v2.1 deployed to production', time: '6 hours ago', type: 'system' },
  { id: 5, action: 'User "planner_q1" account created', time: '1 day ago', type: 'user' },
];

export default function AdminPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">System Administration</h1>
            <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All systems nominal — Master control panel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-purple-500" />
          Super Admin Access
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Users', value: DEMO_STATS.totalUsers, icon: <Users className="w-4 h-4 text-blue-500" /> },
          { label: 'Active Ops', value: DEMO_STATS.activeOperators, icon: <Shield className="w-4 h-4 text-emerald-500" /> },
          { label: 'Map Nodes', value: DEMO_STATS.totalNodes, icon: <Database className="w-4 h-4 text-cyan-500" /> },
          { label: 'Map Edges', value: DEMO_STATS.totalEdges, icon: <Zap className="w-4 h-4 text-amber-500" /> },
          { label: 'Uptime', value: DEMO_STATS.systemUptime, icon: <TrendingUp className="w-4 h-4 text-violet-500" /> },
          { label: 'Last Backup', value: DEMO_STATS.lastBackup, icon: <Clock className="w-4 h-4 text-orange-500" /> },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-xl border-border/80">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">{stat.icon}</div>
              <p className="text-xl font-heading font-black">{stat.value}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="bg-card/50 backdrop-blur-xl border-border/80 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer group h-full">
              <CardContent className="p-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-4 group-hover:scale-110 transition-transform ${link.color}`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors">{link.label}</h3>
                <p className="text-xs text-muted-foreground font-medium">{link.description}</p>
                <div className="flex justify-end mt-3">
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-card/40 backdrop-blur-xl shadow-2xl border-border/80">
        <CardHeader className="p-4 pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ActivitySquare className="w-4 h-4 text-violet-500" />
            Recent System Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {RECENT_ACTIVITIES.map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 border border-transparent hover:border-border transition-all">
                <div className="mt-0.5 shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${act.type === 'user' ? 'bg-blue-500' : act.type === 'system' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{act.action}</p>
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {act.time}
                  </p>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider shrink-0">
                  {act.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import {
  Settings, Globe, Bell, Shield, Clock, Save,
  Database, Cpu, MapPin, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Settings className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">System Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure global parameters for CivicTwin AI</p>
          </div>
        </div>
        <Button onClick={handleSave} className="shadow-lg shadow-primary/20">
          {saved ? (
            <span className="flex items-center gap-2 text-emerald-300"><Zap className="w-4 h-4" /> Saved</span>
          ) : (
            <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</span>
          )}
        </Button>
      </div>

      {/* General */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" /> General
          </CardTitle>
          <CardDescription>Basic system configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Name</label>
              <Input defaultValue="CivicTwin AI - Ho Chi Minh City" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Default Language</label>
              <Select defaultValue="vi">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tieng Viet</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Default Map Center (Lat)</label>
              <Input type="number" defaultValue="10.7769" step="0.0001" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Default Map Center (Lng)</label>
              <Input type="number" defaultValue="106.7009" step="0.0001" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-500" /> AI Engine
          </CardTitle>
          <CardDescription>Machine learning model parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Model</label>
              <Select defaultValue="gnn-v2.1">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gnn-v2.1">GNN v2.1 (Spatial Graph)</SelectItem>
                  <SelectItem value="lstm-v1.4">LSTM v1.4 (Time Series)</SelectItem>
                  <SelectItem value="ensemble">Ensemble (GNN + LSTM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prediction Horizon (mins)</label>
              <Input type="number" defaultValue="30" min="5" max="120" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Confidence Threshold</label>
              <Input type="number" defaultValue="0.75" step="0.05" min="0" max="1" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Auto-trigger on Incident</label>
              <Select defaultValue="yes">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Enabled</SelectItem>
                  <SelectItem value="no">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" /> Notifications
          </CardTitle>
          <CardDescription>Alert and push notification settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Citizen Alert Radius (km)</label>
              <Input type="number" defaultValue="5" min="1" max="50" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Critical Alert Channel</label>
              <Select defaultValue="push_email">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">Push Notification Only</SelectItem>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="push_email">Push + Email</SelectItem>
                  <SelectItem value="sms">SMS (Premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card className="bg-card/50 backdrop-blur-xl border-border/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" /> Data Retention
          </CardTitle>
          <CardDescription>Automated data lifecycle policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sensor Data</label>
              <Select defaultValue="90">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Incident Logs</label>
              <Select defaultValue="365">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">System Logs</label>
              <Select defaultValue="30">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import api from "@/lib/api";
import { FileText, Clock, AlertTriangle, CheckCircle2, Loader2, MapPin, ChevronRight, RefreshCw, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";

interface Report {
  id: number;
  type: string;
  severity: string;
  location_name?: string;
  title?: string;
  description: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  low: { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  high: { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  critical: { color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

export default function MyReportsPage() {
  const { t, locale } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incidents?source=citizen&per_page=50');
      setReports(res.data.data || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }
    if (user) fetchReports();
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    open: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-amber-500", label: t('citizen.pending') },
    pending: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-muted-foreground", label: t('citizen.pending') },
    investigating: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-500", label: t('citizen.underReview') },
    reviewing: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-500", label: t('citizen.underReview') },
    resolved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-500", label: t('citizen.resolved') },
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: "2-digit", month: "short", year: "numeric",
  });

  const pendingCount = reports.filter(r => r.status === "pending" || r.status === "open").length;
  const resolvedCount = reports.filter(r => r.status === "resolved").length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t('citizen.myReports')}</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[52px]">
            {t('citizen.myReportsSubtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={loading} className="gap-2 mt-1">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t('citizen.total'), value: reports.length, color: "text-blue-500" },
          { label: t('citizen.pending'), value: pendingCount, color: "text-amber-500" },
          { label: t('citizen.resolved'), value: resolvedCount, color: "text-emerald-500" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-card/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* Reports List */}
      {!loading && reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-6 bg-secondary rounded-full mb-6">
              <FileText className="w-12 h-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('citizen.noReports')}</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              {t('citizen.noReportsDesc')}
            </p>
            <Button onClick={() => router.push("/map")} className="rounded-full px-6">
              {t('citizen.openLiveMap')}
            </Button>
          </CardContent>
        </Card>
      ) : !loading && (
        <div className="space-y-3">
          {reports.map((report) => {
            const sev = severityConfig[report.severity] || severityConfig.low;
            const stat = statusConfig[report.status] || statusConfig.pending;
            return (
              <Card
                key={report.id}
                className="bg-card/80 backdrop-blur hover:shadow-lg hover:border-primary/20 transition-all group cursor-pointer"
                onClick={() => setSelected(report)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Type + Severity */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-base font-bold">
                          {t(`enums.incidentType.${report.type}`)}
                        </span>
                        <Badge className={`text-[11px] font-bold uppercase tracking-wider ${sev.bg} ${sev.border} ${sev.color} border`}>
                          {t(`enums.incidentSeverity.${report.severity}`)}
                        </Badge>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{report.location_name || report.title}</span>
                      </div>

                      {/* Description */}
                      {report.description && (
                        <p className="text-sm text-muted-foreground/70 line-clamp-1">{report.description}</p>
                      )}
                    </div>

                    {/* Right side: Status + Time */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold ${stat.color}`}>
                        {stat.icon}
                        {stat.label}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(report.created_at)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (() => {
            const sev = severityConfig[selected.severity] || severityConfig.low;
            const stat = statusConfig[selected.status] || statusConfig.pending;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Eye className="w-5 h-5 text-primary" />
                    {t('citizen.reportDetail')}
                  </DialogTitle>
                  <DialogDescription>
                    #{selected.id} — {formatDate(selected.created_at)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {/* Type + Severity + Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider">
                      {t(`enums.incidentType.${selected.type}`)}
                    </Badge>
                    <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${sev.bg} ${sev.border} ${sev.color}`}>
                      {t(`enums.incidentSeverity.${selected.severity}`)}
                    </Badge>
                    <Badge variant="secondary" className={`text-[10px] font-bold uppercase tracking-wider gap-1 ${stat.color}`}>
                      {stat.icon} {stat.label}
                    </Badge>
                  </div>

                  {/* Location */}
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('report.location')}</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      {selected.location_name || selected.title || '—'}
                    </p>
                  </div>

                  {/* Description */}
                  {selected.description && (
                    <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('op.description')}</p>
                      <p className="text-sm leading-relaxed">{selected.description}</p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary/50 rounded-xl p-3 border border-border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('citizen.submittedAt')}</p>
                      <p className="text-sm font-medium">{formatDate(selected.created_at)}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3 border border-border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('citizen.lastUpdated')}</p>
                      <p className="text-sm font-medium">{selected.updated_at ? formatDate(selected.updated_at) : '—'}</p>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

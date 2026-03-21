"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useEcho } from "@/hooks/useEcho";
import { Bell, AlertTriangle, Info, ShieldAlert, MapPin, Clock, Filter } from "lucide-react";

interface Alert {
  id: number;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  area: string;
  created_at: string;
  active: boolean;
}

const demoAlerts: Alert[] = [
  {
    id: 1,
    title: "Tai nạn nghiêm trọng trên cầu Sài Gòn",
    description: "Tai nạn liên hoàn 3 xe, đường bị chặn 2 làn. Dự kiến kéo dài 2 tiếng. Khuyến cáo đi đường vòng qua hầm Thủ Thiêm.",
    severity: "critical",
    area: "Cầu Sài Gòn, Q.2 ↔ Q.Bình Thạnh",
    created_at: "2026-03-20T22:15:00Z",
    active: true,
  },
  {
    id: 2,
    title: "Ngập nước tuyến đường Nguyễn Hữu Cảnh",
    description: "Mực nước lên 40cm do triều cường kết hợp mưa lớn. Các phương tiện nhỏ không thể lưu thông.",
    severity: "warning",
    area: "Đường Nguyễn Hữu Cảnh, Q.Bình Thạnh",
    created_at: "2026-03-20T19:30:00Z",
    active: true,
  },
  {
    id: 3,
    title: "Thi công sửa chữa mặt đường Lê Lợi",
    description: "Phong tỏa 1 làn xe từ 22h đến 5h sáng cho thi công sửa chữa mặt đường. Ảnh hưởng nhẹ lưu thông.",
    severity: "info",
    area: "Đường Lê Lợi, Q.1",
    created_at: "2026-03-20T10:00:00Z",
    active: false,
  },
  {
    id: 4,
    title: "Ùn tắc kéo dài khu vực sân bay Tân Sơn Nhất",
    description: "Lưu lượng xe cao bất thường do giờ cao điểm và nhiều chuyến bay hạ cánh. AI dự đoán kéo dài đến 20h.",
    severity: "warning",
    area: "Đường Trường Sơn, Q.Tân Bình",
    created_at: "2026-03-20T17:00:00Z",
    active: true,
  },
];

export default function AlertsPage() {
  const { t, locale } = useTranslation();
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "critical">("all");
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);

  // Real-time: new incidents appear as alerts
  useEcho<any>('traffic', 'IncidentCreated', (data) => {
    const newAlert: Alert = {
      id: data.id || Date.now(),
      title: data.title || 'New Incident',
      description: data.description || '',
      severity: data.severity === 'critical' ? 'critical' : data.severity === 'high' ? 'warning' : 'info',
      area: data.location_name || '',
      created_at: data.created_at || new Date().toISOString(),
      active: true,
    };
    setLiveAlerts(prev => [newAlert, ...prev]);
  });

  const allAlerts = [...liveAlerts, ...demoAlerts];
  const filteredAlerts = filter === "all" ? allAlerts : allAlerts.filter((a) => a.severity === filter);

  const severityConfig = {
    info: { icon: <Info className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: t('citizen.info') },
    warning: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: t('citizen.warning') },
    critical: { icon: <ShieldAlert className="w-4 h-4" />, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", label: t('citizen.critical') },
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('citizen.trafficAlerts')}</h1>
        </div>
        <p className="text-slate-400 text-sm ml-[52px]">
          {t('citizen.alertsSubtitle')}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-slate-500 shrink-0" />
        {(["all", "critical", "warning", "info"] as const).map((f) => {
          const isActive = filter === f;
          const config = f !== "all" ? severityConfig[f] : null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white"
              }`}
            >
              {config ? (
                <span className="flex items-center gap-1.5">
                  {config.icon}
                  {config.label}
                </span>
              ) : (
                t('citizen.allCount', { n: String(demoAlerts.length) })
              )}
            </button>
          );
        })}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 bg-slate-800/50 rounded-full mb-6">
            <Bell className="w-12 h-12 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-300 mb-2">{t('citizen.noAlerts')}</h2>
          <p className="text-slate-500 max-w-sm">
            {t('citizen.noAlertsDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const sev = severityConfig[alert.severity];
            return (
              <div
                key={alert.id}
                className={`relative bg-slate-900/50 backdrop-blur border rounded-2xl p-5 transition-all hover:bg-slate-800/50 ${
                  alert.active ? "border-white/10 hover:border-white/15" : "border-white/5 opacity-60"
                }`}
              >
                {/* Active pulse indicator */}
                {alert.active && (
                  <div className="absolute top-5 right-5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        alert.severity === "critical" ? "bg-rose-400" : "bg-amber-400"
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        alert.severity === "critical" ? "bg-rose-500" : "bg-amber-500"
                      }`}></span>
                    </span>
                  </div>
                )}

                {/* Severity Badge + Title */}
                <div className="flex items-center gap-3 mb-2.5">
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${sev.bg} ${sev.border} ${sev.color}`}
                  >
                    {sev.icon}
                    {sev.label}
                  </span>
                  {!alert.active && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
                      {t('citizen.expired')}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-1.5">{alert.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">{alert.description}</p>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    {alert.area}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(alert.created_at).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

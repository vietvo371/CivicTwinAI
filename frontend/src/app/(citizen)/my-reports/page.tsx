"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { FileText, Clock, AlertTriangle, CheckCircle2, Loader2, MapPin, ChevronRight } from "lucide-react";

interface Report {
  id: number;
  type: string;
  severity: string;
  location: string;
  description: string;
  status: string;
  created_at: string;
}

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  low: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  high: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="w-3.5 h-3.5" />, color: "text-slate-400", label: "Pending" },
  reviewing: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-400", label: "Under Review" },
  resolved: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-emerald-400", label: "Resolved" },
};

const typeLabels: Record<string, string> = {
  accident: "Accident",
  breakdown: "Vehicle Breakdown",
  flood: "Flooding",
  construction: "Road Work",
  other: "Other",
};

// Demo data
const demoReports: Report[] = [
  {
    id: 1,
    type: "accident",
    severity: "high",
    location: "Ngã tư Hàng Xanh, Q. Bình Thạnh",
    description: "Va chạm giữa 2 ô tô, gây tắc nghẽn nghiêm trọng",
    status: "reviewing",
    created_at: "2026-03-20T14:30:00Z",
  },
  {
    id: 2,
    type: "flood",
    severity: "medium",
    location: "Đường Nguyễn Hữu Cảnh, Q.Bình Thạnh",
    description: "Đường ngập nước khoảng 30cm sau mưa lớn",
    status: "pending",
    created_at: "2026-03-19T09:15:00Z",
  },
  {
    id: 3,
    type: "construction",
    severity: "low",
    location: "Đường Lê Lợi, Q.1",
    description: "Đang thi công sửa ống nước, chặn 1 làn đường",
    status: "resolved",
    created_at: "2026-03-18T16:45:00Z",
  },
];

export default function MyReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reports] = useState<Report[]>(demoReports);
  const [loading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
        </div>
        <p className="text-slate-400 text-sm ml-[52px]">
          Track the status of your submitted incident reports
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total", value: reports.length, color: "text-blue-400" },
          { label: "Pending", value: reports.filter((r) => r.status === "pending").length, color: "text-amber-400" },
          { label: "Resolved", value: reports.filter((r) => r.status === "resolved").length, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-4 text-center"
          >
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-6 bg-slate-800/50 rounded-full mb-6">
            <FileText className="w-12 h-12 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-300 mb-2">No Reports Yet</h2>
          <p className="text-slate-500 max-w-sm mb-6">
            You haven&apos;t submitted any incident reports yet. Head to the Live Map to report a traffic issue.
          </p>
          <button
            onClick={() => router.push("/map")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full transition-colors"
          >
            Open Live Map
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const sev = severityConfig[report.severity] || severityConfig.low;
            const stat = statusConfig[report.status] || statusConfig.pending;
            return (
              <div
                key={report.id}
                className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-5 hover:bg-slate-800/50 hover:border-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Type + Severity */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base font-bold">
                        {typeLabels[report.type] || report.type}
                      </span>
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${sev.bg} ${sev.border} ${sev.color} border`}
                      >
                        {report.severity}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{report.location}</span>
                    </div>

                    {/* Description */}
                    {report.description && (
                      <p className="text-sm text-slate-500 line-clamp-1">{report.description}</p>
                    )}
                  </div>

                  {/* Right side: Status + Time */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${stat.color}`}>
                      {stat.icon}
                      {stat.label}
                    </div>
                    <span className="text-[11px] text-slate-600">
                      {new Date(report.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { ShieldCheck, Users, Database, LayoutDashboard } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-slate-100 tracking-tight">Hệ Thống Quản Trị</h1>
            <p className="text-sm font-medium text-slate-400 mt-1">
              Phân quyền City Admin toàn thành phố
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-3 text-center transition-colors hover:border-slate-500 hover:bg-slate-800">
          <Users className="w-8 h-8 text-blue-400" />
          <h2 className="font-bold text-slate-200">Quản lý User</h2>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-3 text-center transition-colors hover:border-slate-500 hover:bg-slate-800">
          <Database className="w-8 h-8 text-emerald-400" />
          <h2 className="font-bold text-slate-200">Dữ liệu Master</h2>
        </div>
        
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col items-center justify-center gap-3 text-center transition-colors hover:border-slate-500 hover:bg-slate-800">
          <LayoutDashboard className="w-8 h-8 text-orange-400" />
          <h2 className="font-bold text-slate-200">Cấu hình Global</h2>
        </div>
      </div>
    </div>
  );
}

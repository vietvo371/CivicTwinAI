'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  Database,
  LogOut,
  Settings,
  ActivitySquare
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const ADMIN_NAVIGATION = [
  { name: 'Dashboard', href: '/admin', icon: ShieldCheck },
  { name: 'Quản lý Người dùng', href: '/admin/users', icon: Users },
  { name: 'Dữ liệu Master', href: '/admin/master', icon: Database },
  { name: 'Cấu hình Hệ thống', href: '/admin/settings', icon: Settings },
  { name: 'System Logs', href: '/admin/logs', icon: ActivitySquare },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[72px] lg:w-[260px] bg-slate-900/80 backdrop-blur-3xl border-r border-slate-700/50 transition-all duration-300 flex flex-col items-center lg:items-stretch shadow-2xl">
      {/* Brand */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)] overflow-hidden relative">
          <div className="absolute inset-0 bg-purple-500/20 animate-pulse" />
          <ShieldCheck className="w-6 h-6 text-purple-400 relative z-10" />
        </div>
        <div className="hidden lg:flex flex-col ml-3">
          <span className="text-lg font-bold font-heading text-slate-100 tracking-wider">CivicTwin</span>
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em]">City Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full py-6 flex flex-col gap-2 px-3 overflow-y-auto override-scrollbar">
        {ADMIN_NAVIGATION.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block text-sm font-semibold tracking-wide flex-1 truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-slate-700/50 flex flex-col gap-2">
        <div className="hidden lg:flex flex-col px-2 py-1 mb-2">
          <span className="text-xs font-semibold text-slate-300 truncate">{user?.name || 'Administrator'}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user?.roles?.[0] || 'admin'}</span>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="hidden lg:block text-sm font-bold tracking-wide">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

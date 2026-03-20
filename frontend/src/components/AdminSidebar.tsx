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
import { ThemeToggle } from './ThemeToggle';

const ADMIN_NAVIGATION = [
  { name: 'Dashboard', href: '/admin', icon: ShieldCheck },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Master Data', href: '/admin/master', icon: Database },
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
  { name: 'System Logs', href: '/admin/logs', icon: ActivitySquare },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[72px] lg:w-[260px] bg-card/95 backdrop-blur-3xl border-r border-border transition-all duration-300 flex flex-col items-center lg:items-stretch shadow-2xl">
      {/* Brand */}
      <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-border bg-muted/20">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.15)] overflow-hidden relative shrink-0">
          <div className="absolute inset-0 bg-purple-500/20 animate-pulse" />
          <ShieldCheck className="w-6 h-6 text-purple-400 relative z-10" />
        </div>
        <div className="hidden lg:flex flex-col ml-3">
          <span className="text-lg font-bold font-heading text-foreground tracking-wider">CivicTwin</span>
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-[0.2em]">City Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full py-6 flex flex-col gap-2 px-3 overflow-y-auto no-scrollbar">
        {ADMIN_NAVIGATION.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 lg:py-3.5 rounded-xl transition-all duration-200 relative overflow-hidden ${
                isActive 
                  ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground border border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block text-sm font-semibold tracking-wide flex-1 truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="p-4 border-t border-border flex flex-col gap-2 bg-muted/10">
        <div className="hidden lg:flex flex-col px-2 py-1 mb-2">
          <span className="text-xs font-semibold text-foreground truncate">{user?.name || 'Administrator'}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user?.roles?.[0] || 'admin'}</span>
        </div>
        
        <div className="flex items-center justify-center lg:justify-between px-2 pt-1 pb-2">
          <span className="hidden lg:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Theme</span>
          <ThemeToggle collapsed={false} />
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 lg:px-4 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors border border-transparent hover:border-destructive/20"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="hidden lg:block text-sm font-bold tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  );
}

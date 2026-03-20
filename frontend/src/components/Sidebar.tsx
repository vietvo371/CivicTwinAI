'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map, AlertTriangle, Brain, Lightbulb, BarChart3,
  LogOut, Menu, X, Activity,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/dashboard', icon: Map, label: 'Traffic Map' },
  { href: '/dashboard/incidents', icon: AlertTriangle, label: 'Sự cố' },
  { href: '/dashboard/predictions', icon: Brain, label: 'Dự đoán' },
  { href: '/dashboard/recommendations', icon: Lightbulb, label: 'Đề xuất' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Phân tích' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Auto-collapse on mobile/tablet
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-700/50 bg-slate-800/90 backdrop-blur-xl ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      }`}
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 p-4 h-[72px] border-b border-slate-700/50 bg-slate-800/50">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        
        <div className={`flex flex-col min-w-0 transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 flex-1'}`}>
          <span className="font-heading font-bold text-[15px] tracking-tight text-slate-100 truncate">CivicTwin AI</span>
          <span className="text-xs font-medium text-slate-400 truncate tracking-wide uppercase">Command Center</span>
        </div>

        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 ml-auto rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors shrink-0"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1.5 overflow-y-auto override-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 min-h-[44px] rounded-xl transition-all duration-200 group cursor-pointer ${
                isActive 
                  ? 'bg-blue-500/10 text-blue-400 font-semibold shadow-sm shadow-blue-500/5' 
                  : 'text-slate-400 hover:bg-slate-700/40 hover:text-slate-200 font-medium'
              }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110 text-blue-400' : 'group-hover:scale-110'}`} />
              
              <span className={`text-sm whitespace-nowrap transition-all duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 flex-1'}`}>
                {item.label}
              </span>
              
              {isActive && !collapsed && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:border-slate-600 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 font-heading font-bold flex items-center justify-center shrink-0">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          
          <div className={`flex flex-col min-w-0 transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 flex-1'}`}>
            <span className="text-sm font-semibold text-slate-200 truncate">{user?.name}</span>
            <span className="text-[11px] font-medium text-slate-500 tracking-wider uppercase truncate">
              {user?.roles?.[0]?.replace('_', ' ') || 'Operator'}
            </span>
          </div>

          <button 
            onClick={logout}
            title="Đăng xuất" 
            className={`p-2 rounded-lg shrink-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${collapsed ? 'mx-auto' : ''}`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map, AlertTriangle, Brain, Lightbulb, BarChart3,
  LogOut, Menu, X, Activity,
} from 'lucide-react';
import { useState } from 'react';

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

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300"
      style={{
        width: collapsed ? '72px' : 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--accent), #8b5cf6)' }}>
          <Activity className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>CivicTwin AI</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Traffic Control</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
              style={{
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
              }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--accent)' }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.roles?.[0] || 'user'}
              </div>
            </div>
          )}
          <button onClick={logout} title="Đăng xuất"
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors flex-shrink-0">
            <LogOut className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>
    </aside>
  );
}

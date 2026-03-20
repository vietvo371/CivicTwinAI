'use client';

import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
        Phân tích giao thông
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Sự cố hôm nay', value: '—', color: 'var(--danger)' },
          { label: 'Dự đoán thành công', value: '—', color: 'var(--success)' },
          { label: 'Đề xuất chờ duyệt', value: '—', color: 'var(--warning)' },
        ].map((kpi) => (
          <div key={kpi.label} className="p-5 rounded-xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
            <div className="text-3xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-8 text-center"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
        Biểu đồ phân tích sẽ được thêm trong Phase 2
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AlertTriangle, Plus, Eye, Clock, Filter } from 'lucide-react';

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: string;
  status: string;
  source: string;
  created_at: string;
  reporter?: { name: string };
  assignee?: { name: string };
}

const severityColors: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626',
};

const statusColors: Record<string, string> = {
  open: '#3b82f6', investigating: '#f59e0b', resolved: '#22c55e', closed: '#64748b',
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', severity: '' });
  const [showCreate, setShowCreate] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      if (filter.severity) params.set('severity', filter.severity);
      const res = await api.get(`/incidents?${params}`);
      setIncidents(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, [filter]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api.post('/incidents', {
        title: form.get('title'),
        type: form.get('type'),
        severity: form.get('severity'),
        source: 'operator',
        description: form.get('description'),
      });
      setShowCreate(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--warning)' }} />
            Quản lý Sự cố
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {incidents.length} sự cố
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: 'var(--accent)' }}
        >
          <Plus className="w-4 h-4" /> Tạo sự cố
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }}>
            <option value="">Tất cả trạng thái</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          <select value={filter.severity} onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
            className="bg-transparent text-sm outline-none" style={{ color: 'var(--text-primary)' }}>
            <option value="">Tất cả mức độ</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        {loading ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>Đang tải...</div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>Không có sự cố nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Tiêu đề', 'Loại', 'Mức độ', 'Trạng thái', 'Nguồn', 'Thời gian', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-[var(--bg-hover)] transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>#{inc.id}</td>
                  <td className="px-4 py-3 font-medium">{inc.title}</td>
                  <td className="px-4 py-3 capitalize" style={{ color: 'var(--text-secondary)' }}>{inc.type}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: `${severityColors[inc.severity]}20`, color: severityColors[inc.severity] }}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: `${statusColors[inc.status]}20`, color: statusColors[inc.status] }}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{inc.source}</td>
                  <td className="px-4 py-3 text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Clock className="w-3 h-3" />
                    {new Date(inc.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded hover:bg-[var(--bg-hover)]">
                      <Eye className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-lg rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold">Tạo sự cố mới</h2>

            <input name="title" required placeholder="Tiêu đề sự cố"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />

            <div className="grid grid-cols-2 gap-3">
              <select name="type" required className="px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="accident">Tai nạn</option>
                <option value="congestion">Ùn tắc</option>
                <option value="construction">Thi công</option>
                <option value="weather">Thời tiết</option>
                <option value="other">Khác</option>
              </select>

              <select name="severity" required className="px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="critical">Nghiêm trọng</option>
              </select>
            </div>

            <textarea name="description" rows={3} placeholder="Mô tả chi tiết..."
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}>
                Hủy
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'var(--accent)' }}>
                Tạo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

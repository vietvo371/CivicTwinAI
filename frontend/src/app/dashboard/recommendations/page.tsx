'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Lightbulb, Check, X, Clock, Shield, Route, Bell } from 'lucide-react';

interface Recommendation {
  id: number;
  incident_id: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
  approved_at?: string;
  approver?: { name: string };
}

const typeIcons: Record<string, typeof Shield> = {
  priority_route: Shield, reroute: Route, alert: Bell,
};

const typeColors: Record<string, string> = {
  priority_route: '#ef4444', reroute: '#f59e0b', alert: '#3b82f6',
};

const statusColors: Record<string, string> = {
  pending: '#f59e0b', approved: '#22c55e', rejected: '#ef4444', executed: '#8b5cf6',
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const fetchRecs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recommendations');
      setRecs(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecs(); }, []);

  const handleApprove = async (id: number) => {
    await api.patch(`/recommendations/${id}/approve`);
    fetchRecs();
  };

  const handleReject = async () => {
    if (!rejectId || !reason) return;
    await api.patch(`/recommendations/${rejectId}/reject`, { reason });
    setRejectId(null);
    setReason('');
    fetchRecs();
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Lightbulb className="w-6 h-6" style={{ color: 'var(--warning)' }} />
        Đề xuất hành động
      </h1>

      {loading ? (
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Đang tải...</div>
      ) : recs.length === 0 ? (
        <div className="p-12 text-center rounded-xl"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
          Chưa có đề xuất nào.
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => {
            const Icon = typeIcons[rec.type] || Lightbulb;
            const color = typeColors[rec.type] || 'var(--accent)';

            return (
              <div key={rec.id} className="p-4 rounded-xl transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold capitalize">{rec.type.replace('_', ' ')}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: `${statusColors[rec.status]}20`, color: statusColors[rec.status] }}>
                        {rec.status}
                      </span>
                      <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                        Incident #{rec.incident_id}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rec.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3 h-3" />
                      {new Date(rec.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  {rec.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleApprove(rec.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ background: '#22c55e20' }} title="Phê duyệt">
                        <Check className="w-4 h-4" style={{ color: 'var(--success)' }} />
                      </button>
                      <button onClick={() => setRejectId(rec.id)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ background: '#ef444420' }} title="Từ chối">
                        <X className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold">Lý do từ chối</h2>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              rows={3} placeholder="Nhập lý do..."
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setRejectId(null); setReason(''); }}
                className="px-4 py-2 rounded-lg text-sm" style={{ color: 'var(--text-secondary)' }}>Hủy</button>
              <button onClick={handleReject} disabled={!reason}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ background: 'var(--danger)' }}>Từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Brain, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PredictionEdge {
  edge_id: number;
  time_horizon_minutes: number;
  predicted_density: number;
  confidence: number;
  severity: string;
  edge?: { name: string };
}

interface Prediction {
  id: number;
  incident_id: number;
  model_version: string;
  status: string;
  processing_time_ms: number;
  created_at: string;
  prediction_edges: PredictionEdge[];
}

const severityColors: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626',
};

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prediction | null>(null);

  useEffect(() => {
    api.get('/predictions')
      .then((res) => setPredictions(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6" style={{ color: '#8b5cf6' }} />
        AI Predictions
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Đang tải...</div>
          ) : predictions.length === 0 ? (
            <div className="p-8 text-center rounded-xl"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
              Chưa có dự đoán nào.
            </div>
          ) : predictions.map((pred) => (
            <button key={pred.id} onClick={() => setSelected(pred)}
              className="w-full text-left p-4 rounded-xl transition-all"
              style={{
                background: selected?.id === pred.id ? 'var(--accent)' : 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">Prediction #{pred.id}</span>
                <span className="flex items-center gap-1 text-xs">
                  {pred.status === 'completed' ? (
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                  )}
                  {pred.status}
                </span>
              </div>
              <div className="flex gap-4 text-xs" style={{ color: selected?.id === pred.id ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                <span>Incident #{pred.incident_id}</span>
                <span>Model: {pred.model_version}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {pred.processing_time_ms}ms
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
          {selected ? (
            <>
              <h2 className="font-bold mb-4">Prediction #{selected.id} — Chi tiết</h2>
              <div className="space-y-3">
                {selected.prediction_edges?.map((pe, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Edge #{pe.edge_id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${severityColors[pe.severity]}20`, color: severityColors[pe.severity] }}>
                        {pe.severity}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Horizon</div>
                        <div className="font-medium">{pe.time_horizon_minutes} min</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Mật độ</div>
                        <div className="font-medium">{(pe.predicted_density * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Confidence</div>
                        <div className="font-medium">{(pe.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                    {/* Density bar */}
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${pe.predicted_density * 100}%`,
                          background: severityColors[pe.severity],
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              Chọn một prediction để xem chi tiết
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Lightbulb, Check, X, Clock, Shield, Route, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface Recommendation {
  id: number;
  incident_id: number;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

const typeIcons: Record<string, typeof Shield> = {
  priority_route: Shield, 
  reroute: Route, 
  alert: Bell,
};

const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: 'Chờ duyệt', variant: 'outline' },
  approved: { label: 'Đã duyệt', variant: 'default' },
  rejected: { label: 'Từ chối', variant: 'destructive' },
  executed: { label: 'Đã thực thi', variant: 'secondary' },
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
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
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
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Lightbulb className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Quyết định Vận hành</h1>
            <p className="text-sm text-muted-foreground mt-1">Danh sách đề xuất được AI sinh ra cần BĐH phê duyệt</p>
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="p-16 text-center border-dashed">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            <span className="font-medium text-muted-foreground animate-pulse">Đang tải danh sách đề xuất...</span>
          </div>
        </Card>
      ) : recs.length === 0 ? (
        <Card className="p-16 text-center border-dashed">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
              <Check className="w-6 h-6 text-emerald-500 opacity-50" />
            </div>
            <p className="font-medium text-lg">Tuyệt vời!</p>
            <p className="text-sm text-muted-foreground">Không có đề xuất nào đang chờ xử lý.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recs.map((rec) => {
            const Icon = typeIcons[rec.type] || Lightbulb;
            const statusInfo = statusMap[rec.status] || { label: rec.status, variant: 'outline' };

            return (
              <Card key={rec.id} className="flex flex-col overflow-hidden hover:border-primary/50 transition-colors group bg-card/60 backdrop-blur-xl">
                <CardHeader className="p-5 border-b border-border/50 bg-card/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-secondary/50 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant={statusInfo.variant} className="uppercase tracking-wider text-[10px]">
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="uppercase tracking-wide text-sm">{rec.type.replace('_', ' ')}</CardTitle>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      LIÊN QUAN SỰ CỐ: <span className="text-primary/80">#{rec.incident_id}</span>
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="p-5 flex-1 flex flex-col pt-5">
                  <p className="text-sm leading-relaxed flex-1">
                    {rec.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-border/50 text-xs font-medium text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(rec.created_at).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </CardContent>

                {rec.status === 'pending' && (
                  <CardFooter className="p-0 border-t border-border/50 grid grid-cols-2 divide-x divide-border/50">
                    <Button 
                      variant="ghost" 
                      className="rounded-none h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setRejectId(rec.id)}
                    >
                      <X className="w-4 h-4 mr-2" /> Từ chối
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="rounded-none h-12 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => handleApprove(rec.id)}
                    >
                      <Check className="w-4 h-4 mr-2" /> Phê duyệt
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="w-5 h-5 text-destructive" />
              Từ chối đề xuất
            </DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp lý do từ chối để hệ thống AI học hỏi và cải thiện trong tương lai.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Ghi chú cụ thể lý do hủy bỏ..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="secondary" onClick={() => { setRejectId(null); setReason(''); }}>
              Đóng
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!reason}>
              Xác nhận Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

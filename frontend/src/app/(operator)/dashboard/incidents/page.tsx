'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { AlertTriangle, Plus, Eye, Clock, Filter, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Incident {
  id: number;
  title: string;
  type: string;
  severity: string;
  status: string;
  source: string;
  created_at: string;
}

const severityMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: 'Low', variant: 'secondary' },
  medium: { label: 'Medium', variant: 'outline' },
  high: { label: 'High', variant: 'default' },
  critical: { label: 'Critical', variant: 'destructive' },
};

const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: 'Open', variant: 'default' },
  investigating: { label: 'Investigating', variant: 'secondary' },
  resolved: { label: 'Resolved', variant: 'outline' },
  closed: { label: 'Closed', variant: 'outline' },
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', severity: 'all' });
  const [createOpen, setCreateOpen] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status !== 'all') params.set('status', filter.status);
      if (filter.severity !== 'all') params.set('severity', filter.severity);
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
      setCreateOpen(false);
      fetchIncidents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Sự cố Giao thông</h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {incidents.length} sự cố đang ghi nhận
            </p>
          </div>
        </div>
        
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Báo cáo sự cố
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Tạo báo cáo sự cố
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin sự cố giao thông mới vào hệ thống cảnh báo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tiêu đề</label>
                <Input name="title" required placeholder="Ví dụ: Tai nạn liên hoàn..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Loại sự cố</label>
                  <select name="type" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="accident">Tai nạn</option>
                    <option value="congestion">Ùn tắc nghiêm trọng</option>
                    <option value="construction">Thi công / Rào chắn</option>
                    <option value="weather">Thời tiết / Ngập lụt</option>
                    <option value="other">Kiểu khác</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mức độ</label>
                  <select name="severity" required className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="critical">Nghiêm trọng</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chi tiết</label>
                <textarea name="description" rows={3} required className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none" placeholder="Vị trí, hướng đi..." />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Hủy</Button>
                <Button type="submit">Gửi báo cáo</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filter.status} onValueChange={(val) => setFilter({ ...filter, status: val || 'all' })}>
          <SelectTrigger className="w-[180px] bg-card/80 backdrop-blur-md">
            <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder="Trạng thái" /></div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filter.severity} onValueChange={(val) => setFilter({ ...filter, severity: val || 'all' })}>
          <SelectTrigger className="w-[180px] bg-card/80 backdrop-blur-md">
            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder="Mức độ" /></div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả mức độ</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Section */}
      <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
        {loading ? (
          <div className="p-16 text-center flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            <span className="font-medium text-muted-foreground animate-pulse">Đang tải dữ liệu sự cố...</span>
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-2">
              <span className="text-2xl opacity-50">🎉</span>
            </div>
            <p className="font-medium text-muted-foreground">Không có sự cố nào khớp với điều kiện lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-card/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px]">Mã</TableHead>
                  <TableHead>Sự cố</TableHead>
                  <TableHead className="text-center">Mức độ</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead className="text-right">Tác vụ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => {
                  const severityInfo = severityMap[inc.severity] || { label: inc.severity, variant: 'outline' };
                  const statusInfo = statusMap[inc.status] || { label: inc.status, variant: 'outline' };

                  return (
                    <TableRow key={inc.id} className="group">
                      <TableCell className="font-heading text-xs text-muted-foreground">#{inc.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{inc.title}</span>
                          <span className="text-xs text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                            {inc.type} 
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 inline-block" /> 
                            <span className="truncate max-w-[120px]">{inc.source}</span>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={severityInfo.variant} className="uppercase text-[10px] tracking-wider">
                          {severityInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusInfo.variant} className="uppercase text-[10px] tracking-wider">
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(inc.created_at).toLocaleString('vi-VN', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

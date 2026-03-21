'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import {
  Users, Search, Plus, Mail, Clock, Phone,
  Edit, Trash2, Loader2, UserPlus, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserRecord = Record<string, any>;

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Toàn quyền hệ thống, quản lý users và cấu hình', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { value: 'city_admin', label: 'City Admin', desc: 'Quản lý hạ tầng đô thị, phê duyệt đề xuất AI', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { value: 'traffic_operator', label: 'Traffic Operator', desc: 'Giám sát giao thông real-time, xử lý sự cố', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { value: 'urban_planner', label: 'Urban Planner', desc: 'Phân tích dữ liệu, mô phỏng quy hoạch', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { value: 'emergency', label: 'Emergency Services', desc: 'Điều phối cứu hộ, xem incident khẩn cấp', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  { value: 'citizen', label: 'Citizen', desc: 'Xem bản đồ công cộng, báo cáo sự cố', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
];

const roleMap = Object.fromEntries(ROLES.map(r => [r.value, r]));

const emptyForm = { name: '', email: '', password: '', phone: '', role: 'citizen', is_active: true };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({ per_page: '100' });
      if (searchQuery) params.append('search', searchQuery);
      if (roleFilter !== 'all') params.append('role', roleFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data?.data) setUsers(res.data.data);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => fetchUsers(), 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // --- CREATE ---
  const openCreate = () => {
    setFormData(emptyForm);
    setFormError('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    setFormError('');
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Vui lòng điền đầy đủ Tên, Email và Mật khẩu.');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/users', formData);
      setCreateOpen(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Tạo user thất bại.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- EDIT ---
  const openEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // leave empty = no change
      phone: user.phone || '',
      role: user.roles?.[0] || 'citizen',
      is_active: user.is_active ?? true,
    });
    setFormError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setFormError('');
    if (!formData.name || !formData.email) {
      setFormError('Tên và Email không được để trống.');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setFormError('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }

    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        is_active: formData.is_active,
      };
      if (formData.password) payload.password = formData.password;

      await api.put(`/admin/users/${selectedUser.id}`, payload);
      setEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Cập nhật thất bại.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- DELETE (deactivate) ---
  const openDelete = (user: UserRecord) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      setDeleteOpen(false);
      fetchUsers();
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  const formatLogin = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa đăng nhập';
    return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- FORM RENDER (NOT a component — avoids remount on re-render) ---
  const renderForm = (mode: 'create' | 'edit') => (
    <div className="space-y-4 pt-2">
      {formError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Họ và tên *</Label>
          <Input placeholder="Nguyễn Văn A" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email *</Label>
          <Input type="email" placeholder="user@civictwin.local" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Số điện thoại</Label>
          <Input placeholder="0905 xxx xxx" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {mode === 'create' ? 'Mật khẩu *' : 'Đổi mật khẩu'}
          </Label>
          <Input
            type="password"
            placeholder={mode === 'create' ? 'Tối thiểu 6 ký tự' : 'Để trống nếu không đổi'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vai trò trong hệ thống *</Label>
        <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v || 'citizen' })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground italic">
          {ROLES.find(r => r.value === formData.role)?.desc}
        </p>
      </div>
      {mode === 'edit' && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
          <div>
            <Label className="text-sm font-semibold">Trạng thái tài khoản</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formData.is_active ? 'Tài khoản đang hoạt động' : 'Tài khoản đã bị vô hiệu hóa'}
            </p>
          </div>
          <Switch
            checked={formData.is_active as boolean}
            onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Quản lý người dùng</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? 'Đang tải...' : `${users.length} tài khoản trong hệ thống`}
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="shadow-lg shadow-primary/20 gap-2">
          <UserPlus className="w-4 h-4" /> Thêm người dùng
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/80 backdrop-blur-md"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v || 'all')}>
          <SelectTrigger className="w-[200px] bg-card/80 backdrop-blur-md">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder="Vai trò" /></div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && users.length === 0 && (
        <Card className="bg-card/50 backdrop-blur-xl border-border/80">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-lg font-semibold text-muted-foreground">Không tìm thấy người dùng</p>
            <p className="text-sm text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc thêm người dùng mới.</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && users.length > 0 && (
        <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-card/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead className="text-center">Vai trò</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead>Đăng nhập lần cuối</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const primaryRole = user.roles?.[0] || 'citizen';
                  const role = roleMap[primaryRole] || roleMap.citizen;
                  const isActive = user.is_active;
                  return (
                    <TableRow key={user.id} className="group">
                      <TableCell className="font-heading text-xs text-muted-foreground">#{user.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-secondary/80 border border-border/50 flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              user.name?.[0]?.toUpperCase() || '?'
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{user.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {user.email}
                              </p>
                              {user.phone && (
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {user.phone}
                                </p>
                              )}
                            </div>
                            {user.provider && (
                              <Badge variant="outline" className="text-[9px] uppercase tracking-wider mt-1 gap-1">
                                <ShieldCheck className="w-2.5 h-2.5" /> {user.provider}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${role.color}`}>
                          {role.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isActive ? 'outline' : 'secondary'} className={`text-[10px] uppercase tracking-wider gap-1 ${isActive ? 'text-emerald-500 border-emerald-500/20' : 'text-muted-foreground'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                          {isActive ? 'Hoạt động' : 'Vô hiệu'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {formatLogin(user.last_login_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Chỉnh sửa" onClick={() => openEdit(user)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Vô hiệu hóa" onClick={() => openDelete(user)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ===== CREATE DIALOG ===== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Thêm người dùng mới
            </DialogTitle>
            <DialogDescription>Tạo tài khoản mới cho hệ thống CivicTwin AI Đà Nẵng.</DialogDescription>
          </DialogHeader>
          {renderForm('create')}
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT DIALOG ===== */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" /> Chỉnh sửa người dùng
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho <strong>{selectedUser?.name}</strong> (#{selectedUser?.id})
            </DialogDescription>
          </DialogHeader>
          {renderForm('edit')}
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Hủy</Button>
            <Button onClick={handleEdit} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRM DIALOG ===== */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Vô hiệu hóa tài khoản
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn vô hiệu hóa tài khoản <strong>{selectedUser?.name}</strong> ({selectedUser?.email})?
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 text-sm space-y-2">
            <p className="font-medium">Hành động này sẽ:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
              <li>Đặt trạng thái tài khoản thành <strong>Vô hiệu</strong></li>
              <li>Thu hồi tất cả token đăng nhập hiện tại</li>
              <li>Ngăn người dùng truy cập hệ thống</li>
            </ul>
            <p className="text-xs text-muted-foreground italic">* Tài khoản không bị xóa vĩnh viễn và có thể kích hoạt lại.</p>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Xác nhận vô hiệu hóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

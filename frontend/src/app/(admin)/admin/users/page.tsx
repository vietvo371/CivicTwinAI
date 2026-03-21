'use client';

import { useState } from 'react';
import {
  Users, Search, Plus, MoreHorizontal, Shield, Mail, Clock,
  ChevronDown, Edit, Trash2, UserCog, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

const DEMO_USERS: User[] = [
  { id: 1, name: 'Nguyen Van Admin', email: 'admin@civictwin.local', role: 'super_admin', status: 'active', lastLogin: '5 mins ago', createdAt: '2026-01-15' },
  { id: 2, name: 'Tran Thi Operator', email: 'operator_q1@civictwin.local', role: 'traffic_operator', status: 'active', lastLogin: '1 hour ago', createdAt: '2026-02-01' },
  { id: 3, name: 'Le Hoang Planner', email: 'planner@civictwin.local', role: 'urban_planner', status: 'active', lastLogin: '3 hours ago', createdAt: '2026-02-10' },
  { id: 4, name: 'Pham Emergency', email: 'emergency@civictwin.local', role: 'emergency', status: 'active', lastLogin: '30 mins ago', createdAt: '2026-02-15' },
  { id: 5, name: 'Vo Thi Citizen', email: 'citizen01@gmail.com', role: 'citizen', status: 'active', lastLogin: '2 days ago', createdAt: '2026-03-01' },
  { id: 6, name: 'Huynh City Admin', email: 'cityadmin@civictwin.local', role: 'city_admin', status: 'active', lastLogin: '10 mins ago', createdAt: '2026-01-20' },
  { id: 7, name: 'Dang Operator 02', email: 'operator_q7@civictwin.local', role: 'traffic_operator', status: 'inactive', lastLogin: '1 week ago', createdAt: '2026-02-20' },
  { id: 8, name: 'Bui Van Tester', email: 'tester@civictwin.local', role: 'citizen', status: 'inactive', lastLogin: '2 weeks ago', createdAt: '2026-03-05' },
];

const roleStyle: Record<string, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  city_admin: { label: 'City Admin', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  traffic_operator: { label: 'Operator', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  urban_planner: { label: 'Planner', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  emergency: { label: 'Emergency', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  citizen: { label: 'Citizen', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = DEMO_USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{DEMO_USERS.length} registered accounts across all roles</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/80 backdrop-blur-md"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-card/80 backdrop-blur-md">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-muted-foreground" /><SelectValue placeholder="Role" /></div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="city_admin">City Admin</SelectItem>
            <SelectItem value="traffic_operator">Operator</SelectItem>
            <SelectItem value="urban_planner">Planner</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="citizen">Citizen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-card/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const role = roleStyle[user.role] || roleStyle.citizen;
                return (
                  <TableRow key={user.id} className="group">
                    <TableCell className="font-heading text-xs text-muted-foreground">#{user.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary/80 border border-border/50 flex items-center justify-center text-sm font-bold shrink-0">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[10px] font-bold uppercase tracking-wider border ${role.color}`}>
                        {role.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.status === 'active' ? 'outline' : 'secondary'} className={`text-[10px] uppercase tracking-wider gap-1 ${user.status === 'active' ? 'text-emerald-500 border-emerald-500/20' : 'text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {user.lastLogin}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit"><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Assign Role"><UserCog className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Create New User
            </DialogTitle>
            <DialogDescription>Add a new user to the CivicTwin AI platform.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
              <Input placeholder="Nguyen Van A" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
              <Input type="email" placeholder="user@civictwin.local" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</label>
                <Select defaultValue="citizen">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">Citizen</SelectItem>
                    <SelectItem value="traffic_operator">Traffic Operator</SelectItem>
                    <SelectItem value="urban_planner">Urban Planner</SelectItem>
                    <SelectItem value="emergency">Emergency Services</SelectItem>
                    <SelectItem value="city_admin">City Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Password</label>
                <Input type="password" placeholder="Min. 8 characters" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="button" onClick={() => setCreateOpen(false)}>Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

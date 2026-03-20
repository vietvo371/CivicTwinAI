import { ShieldCheck, Users, Database, LayoutDashboard } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">System Administration</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Master Data & Role Management Center
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col items-center justify-center gap-3 text-center transition-colors hover:border-primary/50 hover:bg-accent">
          <Users className="w-8 h-8 text-blue-400" />
          <h2 className="font-bold text-foreground">User Management</h2>
        </div>
        
        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col items-center justify-center gap-3 text-center transition-colors hover:border-primary/50 hover:bg-accent">
          <Database className="w-8 h-8 text-emerald-400" />
          <h2 className="font-bold text-foreground">Master Data</h2>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col items-center justify-center gap-3 text-center transition-colors hover:border-primary/50 hover:bg-accent">
          <LayoutDashboard className="w-8 h-8 text-orange-400" />
          <h2 className="font-bold text-foreground">Global Configuration</h2>
        </div>
      </div>
    </div>
  );
}

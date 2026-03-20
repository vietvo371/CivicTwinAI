"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCircle, Mail, Phone, Shield, Camera, FileText, Bell, Loader2, Save, Check } from "lucide-react";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
    if (user) {
      setName(user.name || "");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const getInitials = (n: string) =>
    n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const handleSave = () => {
    // Simulate save
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const providerLabel = user?.roles?.includes("citizen")
    ? "Citizen"
    : user?.roles?.includes("traffic_operator")
    ? "Traffic Operator"
    : "User";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <UserCircle className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        </div>
        <p className="text-slate-400 text-sm ml-[52px]">Manage your personal information</p>
      </div>

      {/* Avatar Section */}
      <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-2 border-white/10">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xl font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <button className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              {providerLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-6 mb-6">
        <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
          <UserCircle className="w-4.5 h-4.5 text-slate-400" />
          Personal Information
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <UserCircle className="w-3.5 h-3.5 text-slate-500" />
              Full Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/40 border-white/10 text-white h-11 focus-visible:ring-blue-500/50 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Email Address
            </label>
            <Input
              value={user.email}
              disabled
              className="bg-black/20 border-white/5 text-slate-500 h-11 font-medium cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-600">Email cannot be changed</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              Phone Number
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+84 xxx xxx xxx"
              className="bg-black/40 border-white/10 text-white h-11 focus-visible:ring-blue-500/50 font-medium"
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 h-11 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
            >
              {saved ? (
                <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Saved!</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-slate-900/50 backdrop-blur border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-5">Activity Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/30 rounded-xl p-5 border border-white/5 text-center">
            <FileText className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-400">3</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Reports Submitted</p>
          </div>
          <div className="bg-black/30 rounded-xl p-5 border border-white/5 text-center">
            <Bell className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-400">4</p>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Alerts Received</p>
          </div>
        </div>
      </div>
    </div>
  );
}

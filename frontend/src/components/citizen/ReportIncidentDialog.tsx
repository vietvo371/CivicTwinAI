"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Camera, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ReportIncidentDialog() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenAlert = () => {
    if (!user) {
      toast.error("Authentication Required", {
        description: "You must be signed in to report an incident.",
        action: {
          label: "Sign In",
          onClick: () => router.push("/login?redirect=/map")
        }
      });
      return;
    }
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setOpen(false);
      toast.success("Incident Reported", {
        description: "Thank you! Your report has been sent to the command center.",
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        onClick={(e) => {
          if (!user) {
            e.preventDefault();
            handleOpenAlert();
          }
        }}
        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 px-6 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.5)] hover:shadow-[0_0_30px_rgba(225,29,72,0.8)] transition-all transform hover:scale-105 group border border-rose-500/50"
      >
        <AlertTriangle className="w-6 h-6 animate-pulse group-hover:animate-none" />
        <span>Report Incident</span>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-xl bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white shadow-2xl rounded-2xl p-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
        
        <DialogHeader className="p-6 pb-4 border-b border-white/5 flex flex-row items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="text-left space-y-1">
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">Report Traffic Incident</DialogTitle>
            <DialogDescription className="text-slate-400">
              Help the city respond faster by providing real-time details.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Location</label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="shrink-0 bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 h-11">
                <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                Current GPS
              </Button>
              <Input 
                placeholder="E.g., Intersection of Han River Bridge..." 
                className="bg-black/40 border-white/10 text-white h-11 focus-visible:ring-rose-500/50" 
                required 
              />
            </div>
          </div>

          {/* Type & Severity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Incident Type</label>
              <Select required defaultValue="accident">
                <SelectTrigger className="bg-black/40 border-white/10 text-white h-11 focus:ring-rose-500/50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="accident">Accident (Crash)</SelectItem>
                  <SelectItem value="breakdown">Vehicle Breakdown</SelectItem>
                  <SelectItem value="flood">Flooding / Weather</SelectItem>
                  <SelectItem value="construction">Road Work / Blocked</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Severity</label>
              <Select required defaultValue="medium">
                <SelectTrigger className="bg-black/40 border-white/10 text-white h-11 focus:ring-rose-500/50">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="low">Low (Partial blockage)</SelectItem>
                  <SelectItem value="medium">Medium (Significant delay)</SelectItem>
                  <SelectItem value="high">High (Complete gridlock)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">Description (Optional)</label>
            <Textarea 
              placeholder="Provide additional details..." 
              className="bg-black/40 border-white/10 text-white min-h-[80px] focus-visible:ring-rose-500/50 resize-none" 
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-1.5 focus-within:ring-2 focus-within:ring-rose-500/50 rounded-xl transition-all">
            <label className="text-sm font-semibold text-slate-300">Photo Evidence (Optional)</label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-white/5 hover:border-white/20 transition-colors cursor-pointer bg-black/20">
              <Camera className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-300">Click to upload photo</p>
              <p className="text-xs opacity-50 mt-1">JPEG, PNG max 5MB</p>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full text-base font-bold h-12 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-rose-900/50" 
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

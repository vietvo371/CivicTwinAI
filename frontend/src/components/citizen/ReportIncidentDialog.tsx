"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import api from "@/lib/api";
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
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [incidentType, setIncidentType] = useState('accident');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');

  const handleOpenAlert = () => {
    if (!user) {
      toast.error(t('auth.authRequired'), {
        description: t('auth.authRequiredDesc'),
        action: {
          label: t('auth.signIn'),
          onClick: () => router.push("/login?redirect=/map")
        }
      });
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    setLoading(true);

    try {
      await api.post('/incidents', {
        title: `${t(`enums.incidentType.${incidentType}`)} - ${location}`,
        type: incidentType,
        severity,
        description: description || undefined,
        source: 'citizen',
        location_name: location,
      });

      setOpen(false);
      setLocation('');
      setDescription('');
      setIncidentType('accident');
      setSeverity('medium');
      toast.success(t('report.incidentReported'), {
        description: t('report.reportSuccess'),
      });
    } catch {
      toast.error(t('report.submitFailed'));
    } finally {
      setLoading(false);
    }
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
        <span>{t('report.reportIncident')}</span>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-xl bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white shadow-2xl rounded-2xl p-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
        
        <DialogHeader className="p-6 pb-4 border-b border-white/5 flex flex-row items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="text-left space-y-1">
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">{t('report.reportTitle')}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t('report.reportDesc')}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">{t('report.location')}</label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="shrink-0 bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 h-11">
                <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                {t('report.currentGPS')}
              </Button>
              <Input 
                placeholder={t('report.locationPlaceholder')}
                className="bg-black/40 border-white/10 text-white h-11 focus-visible:ring-rose-500/50" 
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          {/* Type & Severity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">{t('op.incidentType')}</label>
              <Select required value={incidentType} onValueChange={(v) => setIncidentType(v || 'accident')}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white h-11 focus:ring-rose-500/50">
                  <SelectValue placeholder={t('report.selectType')} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="accident">{t('report.accidentCrash')}</SelectItem>
                  <SelectItem value="breakdown">{t('report.vehicleBreakdown')}</SelectItem>
                  <SelectItem value="flood">{t('report.floodWeather')}</SelectItem>
                  <SelectItem value="construction">{t('report.roadWorkBlocked')}</SelectItem>
                  <SelectItem value="other">{t('report.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">{t('common.severity')}</label>
              <Select required value={severity} onValueChange={(v) => setSeverity(v || 'medium')}>
                <SelectTrigger className="bg-black/40 border-white/10 text-white h-11 focus:ring-rose-500/50">
                  <SelectValue placeholder={t('report.selectSeverity')} />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  <SelectItem value="low">{t('report.lowPartial')}</SelectItem>
                  <SelectItem value="medium">{t('report.mediumDelay')}</SelectItem>
                  <SelectItem value="high">{t('report.highGridlock')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-300">{t('report.descriptionOptional')}</label>
            <Textarea 
              placeholder={t('report.descriptionPlaceholder')}
              className="bg-black/40 border-white/10 text-white min-h-[80px] focus-visible:ring-rose-500/50 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-1.5 focus-within:ring-2 focus-within:ring-rose-500/50 rounded-xl transition-all">
            <label className="text-sm font-semibold text-slate-300">{t('report.photoEvidence')}</label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-white/5 hover:border-white/20 transition-colors cursor-pointer bg-black/20">
              <Camera className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-300">{t('report.clickUpload')}</p>
              <p className="text-xs opacity-50 mt-1">{t('report.maxSize')}</p>
            </div>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full text-base font-bold h-12 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-rose-900/50" 
              disabled={loading}
            >
              {loading ? t('report.submitting') : t('report.submitReport')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

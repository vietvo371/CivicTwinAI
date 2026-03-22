'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { 
  ArrowLeft, AlertTriangle, MapPin, Clock, Info, User, Activity, 
  CheckCircle2, AlertCircle, FileText, BrainCircuit, ShieldAlert 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Interfaces based on IncidentController::show
interface User {
  id: number;
  name: string;
  email: string;
}

interface PredictionEdge {
  id: number;
  edge_id: number;
  predicted_density: string;
  predicted_speed: string;
  congestion_level: string;
}

interface Prediction {
  id: number;
  status: string;
  confidence_score: number;
  prediction_edges: PredictionEdge[];
  created_at: string;
}

interface Recommendation {
  id: number;
  type: string;
  description: string;
  status: string;
}

interface IncidentDetail {
  id: number;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  source: string;
  created_at: string;
  resolved_at: string | null;
  reporter?: User;
  assignee?: User;
  location?: { lat: number; lng: number };
  predictions?: Prediction[];
  recommendations?: Recommendation[];
}

const severityConfig: Record<string, { color: string, badge: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { color: 'text-blue-500', badge: 'secondary' },
  medium: { color: 'text-amber-500', badge: 'outline' },
  high: { color: 'text-orange-500', badge: 'default' },
  critical: { color: 'text-red-600', badge: 'destructive' },
};

const statusConfig: Record<string, { icon: typeof AlertCircle, color: string }> = {
  open: { icon: AlertTriangle, color: 'text-amber-500' },
  investigating: { icon: Activity, color: 'text-blue-500' },
  resolved: { icon: CheckCircle2, color: 'text-green-500' },
  closed: { icon: CheckCircle2, color: 'text-slate-500' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!params || !params.id) return;
      try {
        setLoading(true);
        const res = await api.get(`/incidents/${params.id}`);
        setIncident(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Activity className="w-8 h-8 animate-spin" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6 text-center mt-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold">{error || t('common.noData')}</h2>
        <Button variant="outline" className="mt-6" onClick={() => router.push('/dashboard/incidents')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const sevConf = severityConfig[incident.severity] || severityConfig.low;
  const statConf = statusConfig[incident.status] || statusConfig.open;
  const StatusIcon = statConf.icon;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/incidents')} className="shrink-0 bg-background hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{incident.title}</h1>
              <Badge variant={sevConf.badge} className="uppercase text-[10px] font-bold tracking-wider">
                {t(`enums.incidentSeverity.${incident.severity}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <FileText className="w-4 h-4" />
              Incident #{incident.id}
            </p>
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-lg border bg-background flex items-center gap-2 font-medium shadow-sm ${statConf.color}`}>
          <StatusIcon className="w-5 h-5" />
          {t(`enums.incidentStatus.${incident.status}`)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="w-5 h-5 text-primary" />
                {t('op.generalInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('op.incidentType')}</p>
                  <p className="font-medium text-sm">{t(`enums.incidentType.${incident.type}`)}</p>
                </div>
                <div className="space-y-1.5">
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('op.reportSource')}</p>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {incident.source === 'operator' ? <ShieldAlert className="w-4 h-4 text-blue-500" /> : <User className="w-4 h-4 text-green-500" />}
                    {t(`enums.incidentSource.${incident.source}`)}
                  </p>
                </div>
                <div className="space-y-1.5">
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('op.recordedTime')}</p>
                  <p className="font-medium text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {formatDate(incident.created_at)}
                  </p>
                </div>
                <div className="space-y-1.5">
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('op.locationCoords')}</p>
                  <p className="font-medium text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {incident.location && incident.location.lat ? `${parseFloat(incident.location.lat.toString()).toFixed(4)}, ${parseFloat(incident.location.lng.toString()).toFixed(4)}` : t('op.noCoords')}
                  </p>
                </div>
              </div>
              
              <div className="pt-5 border-t border-border/50">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('op.detailedDescription')}</p>
                <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap border border-muted">
                  {incident.description || <span className="text-muted-foreground italic">{t('op.noDescription')}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Predictions */}
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BrainCircuit className="w-5 h-5 text-primary" />
                {t('op.aiTrafficPrediction')}
              </CardTitle>
              <CardDescription>
                {t('op.aiTrafficPredictionDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {incident.predictions && incident.predictions.length > 0 ? (
                <div className="space-y-4">
                  {incident.predictions.map(pred => (
                    <div key={pred.id} className="p-4 rounded-xl border border-primary/20 bg-primary/[0.02]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-primary">{t('op.evaluationSession', { id: String(pred.id) })}</span>
                        <Badge variant={pred.status === 'completed' ? 'default' : 'outline'} className={pred.status === 'completed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}>
                          {t(`enums.predictionStatus.${pred.status}`)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('op.neuralNetConfidence')}:</span>
                        <strong className="font-bold text-foreground">
                          {typeof pred.confidence_score === 'number' 
                            ? `${(pred.confidence_score * 100).toFixed(1)}%` 
                            : 'N/A'}
                        </strong>
                      </div>
                      <div className="mt-3 pt-3 border-t border-primary/10 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('op.impactScope')}:</span>
                        <span className="font-medium">{t('op.adjacentSegments', { n: String(pred.prediction_edges?.length || 0) })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-muted/30 border border-dashed rounded-xl flex flex-col items-center justify-center gap-3">
                  <Activity className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {incident.severity === 'low' ? t('op.lowSeveritySkipped') : t('op.waitingAiAnalysis')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">{t('op.relatedPersonnel')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('op.reporter')}</p>
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-secondary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{incident.reporter?.name || t('op.automatedSystem')}</p>
                    <p className="text-xs text-muted-foreground truncate">{incident.reporter?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('op.assignedHandler')}</p>
                {incident.assignee ? (
                  <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-xl border border-primary/20">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary truncate">{incident.assignee.name}</p>
                      <p className="text-xs text-primary/70 truncate">{incident.assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 p-3 rounded-xl border border-dashed text-center">
                    <p className="text-sm text-muted-foreground italic">{t('op.notAssigned')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">{t('op.operationalRecommendations')}</CardTitle>
            </CardHeader>
            <CardContent>
              {incident.recommendations && incident.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {incident.recommendations.map(reco => (
                    <div key={reco.id} className="p-4 rounded-xl border bg-background flex flex-col gap-2 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                      <p className="font-semibold text-sm leading-none">{t(`enums.recommendationType.${reco.type}`)}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">{reco.description}</p>
                      <div className="mt-1 flex justify-end">
                        <Badge variant="secondary" className="text-[10px]">
                          {t(`enums.recommendationStatus.${reco.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-muted/30 border border-dashed rounded-xl">
                  <p className="text-sm text-muted-foreground italic">
                    {t('op.noRecommendations')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

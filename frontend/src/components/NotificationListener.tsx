'use client';

import { useEffect } from 'react';
import { getEcho } from '@/lib/echo';
import { useNotifications, type Notification as NotifType } from '@/hooks/useNotifications';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import api from '@/lib/api';

export function NotificationListener() {
  const { addNotification, seedNotifications, seeded } = useNotifications();
  const { t } = useTranslation();
  const router = useRouter();
  
  // Use a ref so the WebSocket listener always has the latest translation function
  // without needing to re-subscribe on language change.
  const tRef = useRef(t);
  tRef.current = t;

  // Seed notifications from API on first mount
  useEffect(() => {
    if (seeded) return;
    const seed = async () => {
      try {
        const res = await api.get('/incidents?per_page=20');
        const incidents = res.data.data || [];
        const items: NotifType[] = incidents.map((inc: any) => ({
          id: `seed-${inc.id}`,
          title: inc.title || 'Incident',
          message: inc.description || inc.location_name || '',
          type: 'incident' as const,
          severity: inc.severity,
          timestamp: new Date(inc.created_at),
          read: inc.status === 'resolved',
          link: `/alerts`,
        }));
        seedNotifications(items);
      } catch {}
    };
    seed();
  }, [seeded, seedNotifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: any;

    try {
      const echo = getEcho();
      channel = echo.channel('traffic');

      console.log('[NotificationListener] ✅ Subscribed to channel: traffic');

      // Exact match for Laravel's fully qualified namespace
      channel.listen('.App\\Events\\IncidentCreated', (data: any) => {
        console.log('[NotificationListener] 🔔 IncidentCreated received:', data);

        const currentT = tRef.current;
        const title = data.title || currentT('notifications.newIncident');
        const rawSeverity = data.severity || 'medium';
        const rawType = data.type || 'other';
        
        const translatedType = currentT(`enums.incidentType.${rawType}`);
        const translatedSeverity = currentT(`enums.incidentSeverity.${rawSeverity}`);
        const link = `/alerts`;

        addNotification({
          title,
          message: currentT('notifications.incidentMessage', {
            type: translatedType,
            severity: translatedSeverity,
          }),
          type: 'incident',
          severity: rawSeverity,
          link,
        });

        const toastFn = rawSeverity === 'critical' ? toast.error
          : rawSeverity === 'high' ? toast.warning
          : toast.info;

        toastFn(
          <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push(link)}>
            <span className="font-medium">{title}</span>
            <span className="text-sm opacity-90">
              {currentT('notifications.incidentMessage', {
                type: translatedType,
                severity: translatedSeverity,
              })}
            </span>
          </div>,
          { duration: 6000 }
        );
      });

      channel.listen('.App\\Events\\PredictionReceived', (data: any) => {
        console.log('[NotificationListener] 🧠 PredictionReceived:', data);

        const currentT = tRef.current;
        const title = currentT('notifications.newPrediction');
        const link = `/dashboard/predictions`;

        addNotification({
          title,
          message: currentT('notifications.predictionMessage', {
            edgeCount: String(data.edges?.length || 0),
          }),
          type: 'prediction',
          link,
        });

        toast.info(
          <div className="cursor-pointer w-full flex flex-col gap-1" onClick={() => router.push(link)}>
            <span className="font-medium">{title}</span>
            <span className="text-sm opacity-90">
              {currentT('notifications.predictionMessage', {
                edgeCount: String(data.edges?.length || 0),
              })}
            </span>
          </div>,
          { duration: 5000 }
        );
      });

      // Debug: listen to ALL events on channel
      channel.listenToAll((event: string, data: any) => {
        console.log(`[NotificationListener] 📡 Raw event: ${event}`, data);
      });

    } catch (err) {
      console.error('[NotificationListener] ❌ Failed to connect:', err);
    }

    return () => {
      try {
        if (channel) {
          channel.stopListening('.App\\Events\\IncidentCreated');
          channel.stopListening('.App\\Events\\PredictionReceived');
        }
        console.log('[NotificationListener] 🔌 Cleanup listeners');
      } catch {}
    };
  }, []);

  return null;
}

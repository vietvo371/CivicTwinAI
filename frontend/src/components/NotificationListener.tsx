'use client';

import { useEffect } from 'react';
import { getEcho } from '@/lib/echo';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from '@/lib/i18n';
import { toast } from 'sonner';

export function NotificationListener() {
  const { addNotification } = useNotifications();
  const { t } = useTranslation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: any;

    try {
      const echo = getEcho();
      channel = echo.channel('traffic');

      console.log('[NotificationListener] ✅ Subscribed to channel: traffic');

      // Dot prefix = exact match (Reverb sends App\Events\IncidentCreated)
      channel.listen('.IncidentCreated', (data: any) => {
        console.log('[NotificationListener] 🔔 IncidentCreated received:', data);

        const title = data.title || t('notifications.newIncident');
        const severity = data.severity || 'medium';

        addNotification({
          title,
          message: t('notifications.incidentMessage', {
            type: data.type || 'incident',
            severity,
          }),
          type: 'incident',
          severity,
        });

        const toastFn = severity === 'critical' ? toast.error
          : severity === 'high' ? toast.warning
          : toast.info;

        toastFn(title, {
          description: t('notifications.incidentMessage', {
            type: data.type || 'incident',
            severity,
          }),
          duration: 6000,
        });
      });

      channel.listen('.PredictionReceived', (data: any) => {
        console.log('[NotificationListener] 🧠 PredictionReceived:', data);

        const title = t('notifications.newPrediction');

        addNotification({
          title,
          message: t('notifications.predictionMessage', {
            edgeCount: String(data.edges?.length || 0),
          }),
          type: 'prediction',
        });

        toast.info(title, {
          description: t('notifications.predictionMessage', {
            edgeCount: String(data.edges?.length || 0),
          }),
          duration: 5000,
        });
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
          channel.stopListening('.IncidentCreated');
          channel.stopListening('.PredictionReceived');
        }
        const echo = getEcho();
        echo.leave('traffic');
        console.log('[NotificationListener] 🔌 Disconnected from channel: traffic');
      } catch {}
    };
  }, []);

  return null;
}

import type { Notification } from '../hooks/useNotifications';

export function mapRemoteMessageToInAppNotification(remoteMessage: any): Notification | null {
  const n = remoteMessage?.notification;
  const d = remoteMessage?.data ?? {};
  const title =
    (typeof n?.title === 'string' && n.title) ||
    (typeof d.title === 'string' && d.title) ||
    'Thông báo';
  const body =
    (typeof n?.body === 'string' && n.body) ||
    (typeof d.body === 'string' && d.body) ||
    '';

  if (!body && title === 'Thông báo') {
    return null;
  }

  return {
    id: `fcm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: 'fcm_push',
    title,
    message: body,
    data: { ...d, _fcm: remoteMessage },
    timestamp: new Date(),
    read: false,
  };
}

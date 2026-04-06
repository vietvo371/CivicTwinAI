type FcmForegroundHandler = (remoteMessage: any) => void;

let handler: FcmForegroundHandler | null = null;

/** Gắn handler (thường từ NotificationBanner + useNotifications cùng instance). */
export function setFcmForegroundHandler(h: FcmForegroundHandler | null) {
  handler = h;
}

export function notifyFcmForeground(remoteMessage: any) {
  handler?.(remoteMessage);
}

import { navigationRef } from './NavigationService';

const MAX_ATTEMPTS = 24;
const DELAY_MS = 150;

function coerceData(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k.startsWith('_')) {
      continue;
    }
    if (v != null && v !== '') {
      out[k] = String(v);
    }
  }
  return out;
}

/**
 * Lấy id phản ánh / incident từ FCM `data` (mọi giá trị là string).
 * Khớp payload Laravel: report_status + report_id, incident_created + incident_id, v.v.
 */
export function extractIncidentDetailIdFromPushData(data: Record<string, string>): number | null {
  const type = data.type ?? '';

  let raw: string | undefined;
  if (type === 'report_status' || type === 'report_status_update') {
    raw = data.report_id ?? data.incident_id ?? data.id;
  } else if (type === 'incident_created') {
    raw = data.incident_id ?? data.report_id ?? data.id;
  } else {
    raw = data.report_id ?? data.incident_id ?? data.id;
  }

  if (raw == null || raw === '') {
    return null;
  }
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Điều hướng IncidentDetail khi user ấn push (background / quit).
 * Retry vì cold start có thể chưa `navigationRef.isReady()`.
 */
export function scheduleNavigateToIncidentDetailFromPush(remoteMessage: {
  data?: Record<string, unknown> | undefined;
}): void {
  const id = extractIncidentDetailIdFromPushData(coerceData(remoteMessage?.data));
  if (id == null) {
    return;
  }

  let attempts = 0;
  const tick = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('IncidentDetail', { id });
      return;
    }
    attempts += 1;
    if (attempts < MAX_ATTEMPTS) {
      setTimeout(tick, DELAY_MS);
    }
  };

  requestAnimationFrame(() => {
    setTimeout(tick, 0);
  });
}

/**
 * Foreground banner / toast: `data` từ useNotifications (WS) hoặc mapFcm (có thể thiếu `type` trong data).
 */
export function navigateToIncidentDetailFromInAppNotification(
  notificationType: string,
  data: unknown,
): void {
  const base = coerceData(data);
  if (!base.type) {
    base.type = notificationType;
  }
  scheduleNavigateToIncidentDetailFromPush({ data: base });
}

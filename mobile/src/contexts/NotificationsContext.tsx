import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { isUuid } from '../utils/isUuid';

export interface Notification {
  id: string;
  type: 'report_status' | 'points_updated' | 'new_nearby_report' | 'incident_created' | 'fcm_push';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read?: boolean;
}

type RefreshCallback = () => void;
let refreshCallbacks: RefreshCallback[] = [];

function getStatusText(status: number): string {
  switch (status) {
    case 0:
      return 'tiếp nhận';
    case 1:
      return 'xác minh';
    case 2:
      return 'đang xử lý';
    case 3:
      return 'hoàn thành';
    case 4:
      return 'từ chối';
    default:
      return 'cập nhật';
  }
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  registerRefreshCallback: (callback: RefreshCallback) => () => void;
  prependNotification: (notification: Notification) => void;
  fetchUnreadCount: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isConnected, subscribe, unsubscribe, listen, subscribePusher } = useWebSocket();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [apiUnreadCount, setApiUnreadCount] = useState(0);

  const wsUnreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const unreadCount = Math.max(apiUnreadCount, wsUnreadCount);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setApiUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
    }
  }, []);

  const registerRefreshCallback = useCallback((callback: RefreshCallback) => {
    refreshCallbacks.push(callback);
    return () => {
      refreshCallbacks = refreshCallbacks.filter(cb => cb !== callback);
    };
  }, []);

  const triggerRefresh = useCallback(() => {
    refreshCallbacks.forEach(callback => callback());
  }, []);

  const prependNotification = useCallback(
    (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      fetchUnreadCount();
      triggerRefresh();
    },
    [fetchUnreadCount, triggerRefresh],
  );

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setApiUnreadCount(0);
      return;
    }
    fetchUnreadCount();
  }, [user?.id, fetchUnreadCount]);

  useEffect(() => {
    if (!isConnected || !user?.id) {
      return;
    }

    const userChannel = `private-user.${user.id}`;
    const publicChannel = 'user-reports';
    const trafficChannel = 'traffic';

    subscribe(userChannel);
    subscribe(publicChannel);
    subscribe(trafficChannel);

    const handleReportStatusUpdate = (data: any) => {
      const reportTitle = data.report?.tieu_de || 'Phản ánh của bạn';
      const newStatus = data.new_status ?? data.report?.trang_thai;
      const oldStatus = data.old_status;
      const statusText = data.status_text || getStatusText(newStatus);

      let message = '';
      switch (newStatus) {
        case 0:
          message = `"${reportTitle}" đã được tiếp nhận`;
          break;
        case 1:
          message = `"${reportTitle}" đang được xác minh`;
          break;
        case 2:
          message = `"${reportTitle}" đang được xử lý`;
          break;
        case 3:
          message = `"${reportTitle}" đã hoàn thành`;
          break;
        case 4:
          message = `"${reportTitle}" đã bị từ chối`;
          break;
        default:
          message = `"${reportTitle}" đã cập nhật: ${statusText}`;
      }

      const notification: Notification = {
        id: `report-${data.report_id || Date.now()}`,
        type: 'report_status',
        title: 'Cập nhật trạng thái',
        message,
        data: {
          ...data.report,
          old_status: oldStatus,
          new_status: newStatus,
          status_text: statusText,
        },
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);
      fetchUnreadCount();
      triggerRefresh();
    };

    try {
      listen(userChannel, 'report.status.updated', handleReportStatusUpdate);
      listen(userChannel, 'App\\Events\\ReportStatusUpdated', handleReportStatusUpdate);
      listen(userChannel, 'App\\Events\\ReportStatusUpdatedForUsers', handleReportStatusUpdate);
      listen(publicChannel, 'report.status.updated', handleReportStatusUpdate);
      listen(publicChannel, 'App\\Events\\ReportStatusUpdatedForUsers', handleReportStatusUpdate);
    } catch (error) {
      console.error('❌ Failed to register Echo listeners:', error);
    }

    let unsubscribePusherReport: (() => void) | undefined;
    try {
      unsubscribePusherReport = subscribePusher('user-reports', 'report.status.updated', (data: any) => {
        handleReportStatusUpdate(data);
      });
    } catch (error) {
      console.error('❌ Failed to register Pusher listener:', error);
    }

    listen(userChannel, 'points.updated', data => {
      const change = data.change || data.points_change || 0;
      const newBalance = data.new_balance || data.total_points || data.points || 0;
      const reason = data.reason || data.ly_do || 'Cập nhật điểm';

      const notification: Notification = {
        id: `points-${Date.now()}`,
        type: 'points_updated',
        title: change > 0 ? 'Điểm uy tín tăng' : 'Điểm uy tín giảm',
        message: `${change > 0 ? '+' : ''}${change} điểm (${reason}). Tổng: ${newBalance} điểm`,
        data,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);
      fetchUnreadCount();
      triggerRefresh();
    });

    listen(userChannel, 'incident.created', data => {
      const notification: Notification = {
        id: `incident-${data.id || Date.now()}`,
        type: 'incident_created',
        title: 'Sự cố mới',
        message: data.title || data.tieu_de || 'Có sự cố mới trong khu vực',
        data,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);
      fetchUnreadCount();
      triggerRefresh();
    });

    try {
      listen(trafficChannel, 'IncidentCreated', (data: any) => {
        const notification: Notification = {
          id: `traffic-incident-${data.id || Date.now()}`,
          type: 'incident_created',
          title: `Sự cố ${data.severity || ''}`.trim(),
          message: data.title || 'Sự cố giao thông mới',
          data,
          timestamp: new Date(),
          read: false,
        };

        setNotifications(prev => [notification, ...prev]);
        fetchUnreadCount();
        triggerRefresh();
      });

      listen(trafficChannel, 'App\\Events\\IncidentCreated', (data: any) => {
        const notification: Notification = {
          id: `traffic-incident-${data.id || Date.now()}`,
          type: 'incident_created',
          title: `Sự cố ${data.severity || ''}`.trim(),
          message: data.title || 'Sự cố giao thông mới',
          data,
          timestamp: new Date(),
          read: false,
        };

        setNotifications(prev => [notification, ...prev]);
        fetchUnreadCount();
        triggerRefresh();
      });
    } catch (error) {
      console.error('❌ Failed to register traffic channel listeners:', error);
    }

    listen(userChannel, 'notification.sent', data => {
      const serverId = data?.notification_id ?? data?.uuid;
      const id =
        serverId != null && isUuid(String(serverId))
          ? String(serverId)
          : `notif-${data?.id ?? Date.now()}`;

      const notification: Notification = {
        id,
        type: data.type || 'report_status',
        title: data.title || data.tieu_de || 'Thông báo mới',
        message: data.message || data.noi_dung || '',
        data,
        timestamp: new Date(),
        read: false,
      };

      setNotifications(prev => [notification, ...prev]);
      fetchUnreadCount();
      triggerRefresh();
    });

    return () => {
      unsubscribePusherReport?.();
      unsubscribe(userChannel);
      unsubscribe(publicChannel);
      unsubscribe(trafficChannel);
    };
    // Chỉ phụ thuộc user + kết nối; hàm từ WebSocketContext không memo → tránh vòng re-subscribe.
  }, [isConnected, user?.id]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setApiUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
      registerRefreshCallback,
      prependNotification,
      fetchUnreadCount,
    }),
    [
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
      registerRefreshCallback,
      prependNotification,
      fetchUnreadCount,
    ],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}

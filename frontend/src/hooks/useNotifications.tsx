'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'incident' | 'prediction' | 'system';
  severity?: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const counterRef = useRef(0);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    counterRef.current += 1;
    const newNotification: Notification = {
      ...n,
      id: `notif-${Date.now()}-${counterRef.current}`,
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

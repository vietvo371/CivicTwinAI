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
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  seedNotifications: (items: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  seeded: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  seedNotifications: () => {},
  markAsRead: () => {},
  markAllRead: () => {},
  clearAll: () => {},
  seeded: false,
});

const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const counterRef = useRef(0);
  const [seeded, setSeeded] = useState(false);

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

  const seedNotifications = useCallback((items: Notification[]) => {
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newItems = items.filter(i => !existingIds.has(i.id));
      return [...prev, ...newItems].slice(0, MAX_NOTIFICATIONS);
    });
    setSeeded(true);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, seedNotifications, markAsRead, markAllRead, clearAll, seeded }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}


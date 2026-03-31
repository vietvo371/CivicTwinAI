'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';

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
    const newId = `notif-${Date.now()}-${counterRef.current}`;
    
    const newNotification: Notification = {
      ...n,
      id: newId,
      timestamp: new Date(),
      read: false, // New realtime notifications start as unread
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));
  }, []);

  const seedNotifications = useCallback((items: Notification[]) => {
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newItems = items
        .filter(i => !existingIds.has(i.id));
      return [...prev, ...newItems].slice(0, MAX_NOTIFICATIONS);
    });
    setSeeded(true);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic Update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    // API Call
    try {
      // Backend expects numeric ID for standard notifications, 
      // but our ID might be a UUID for DB notifications.
      // We strip any 'seed-' or other prefixes if they exist.
      const cleanId = id.replace('seed-', '');
      await api.patch(`/notifications/${cleanId}/read`);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistic Update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    // API Call
    try {
      await api.patch('/notifications/read-all');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      seedNotifications, 
      markAsRead, 
      markAllRead, 
      clearAll, 
      seeded 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

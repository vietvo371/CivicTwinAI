import api from '../utils/Api';
import { ApiResponse } from '../types/api/common';
import { Notification, NotificationFilterParams } from '../types/api/notification';

export const notificationService = {
    getNotifications: async (params?: NotificationFilterParams): Promise<ApiResponse<Notification[]>> => {
        const response = await api.get<ApiResponse<Notification[]>>('/notifications', { params });
        return response.data;
    },

    getUnreadNotifications: async (): Promise<ApiResponse<Notification[]>> => {
        const response = await api.get<ApiResponse<Notification[]>>('/notifications/unread');
        return response.data;
    },

    getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
        const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
        return response.data;
    },

    markAsRead: async (id: string | number): Promise<ApiResponse<any>> => {
        const segment = encodeURIComponent(String(id));
        const response = await api.patch<ApiResponse<any>>(`/notifications/${segment}/read`);
        return response.data;
    },

    markAllAsRead: async (): Promise<ApiResponse<any>> => {
        const response = await api.patch<ApiResponse<any>>('/notifications/read-all');
        return response.data;
    },

    deleteNotification: async (id: string | number): Promise<ApiResponse<void>> => {
        const segment = encodeURIComponent(String(id));
        const response = await api.delete<ApiResponse<void>>(`/notifications/${segment}`);
        return response.data;
    },

    updateSettings: async (settings: {
        push_enabled?: boolean;
        email_enabled?: boolean;
        report_updates?: boolean;
        comment_replies?: boolean;
    }): Promise<ApiResponse<any>> => {
        const response = await api.put<ApiResponse<any>>('/notifications/settings', settings);
        return response.data;
    }
};

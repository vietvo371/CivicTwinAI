import api from '../utils/Api';
import { ApiResponse } from '../types/api/common';
import { Report, ReportDetail, CreateReportRequest, ReportFilterParams } from '../types/api/report';

// Paginated response wrapper for list endpoints
interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
        page?: number | null;
    }>;
}

export const reportService = {
    getReports: async (params?: ReportFilterParams): Promise<ApiResponse<PaginatedResponse<Report>>> => {
        const response = await api.get<ApiResponse<PaginatedResponse<Report>>>('/reports', { params });
        return response.data;
    },

    getReportDetail: async (id: number): Promise<ApiResponse<ReportDetail>> => {
        const response = await api.get<ApiResponse<ReportDetail>>(`/reports/${id}`);
        return response.data;
    },

    createReport: async (data: CreateReportRequest): Promise<ApiResponse<Report>> => {
        const response = await api.post<ApiResponse<Report>>('/reports', data);
        return response.data;
    },

    /** Chỉ gửi field mà `ReportController::update` validate — tránh gửi thừa (tags, media_ids, la_cong_khai BE chưa xử lý khi PUT). */
    updateReport: async (id: number, data: Partial<CreateReportRequest>): Promise<ApiResponse<Report>> => {
        const payload: Record<string, string | number> = {};
        if (data.tieu_de !== undefined) payload.tieu_de = data.tieu_de;
        if (data.mo_ta !== undefined) payload.mo_ta = data.mo_ta;
        if (data.danh_muc !== undefined) payload.danh_muc = data.danh_muc;
        if (data.uu_tien !== undefined && data.uu_tien !== null) payload.uu_tien = data.uu_tien;
        if (data.vi_do !== undefined) payload.vi_do = data.vi_do;
        if (data.kinh_do !== undefined) payload.kinh_do = data.kinh_do;
        if (data.dia_chi !== undefined) payload.dia_chi = data.dia_chi;
        const response = await api.put<ApiResponse<Report>>(`/reports/${id}`, payload);
        return response.data;
    },

    deleteReport: async (id: number): Promise<ApiResponse<void>> => {
        const response = await api.delete<ApiResponse<void>>(`/reports/${id}`);
        return response.data;
    },

    getMyReports: async (params?: ReportFilterParams): Promise<ApiResponse<PaginatedResponse<Report>>> => {
        const response = await api.get<ApiResponse<PaginatedResponse<Report>>>('/reports/my', { params });
        return response.data;
    },

    getNearbyReports: async (lat: number, long: number, radius: number = 5000): Promise<ApiResponse<Report[]>> => {
        // radius in meters (default 5000m = 5km)
        const response = await api.get<ApiResponse<Report[]>>('/reports/nearby', {
            params: { vi_do: lat, kinh_do: long, radius }
        });
        return response.data;
    },

    getTrendingReports: async (limit: number = 10): Promise<ApiResponse<Report[]>> => {
        const response = await api.get<ApiResponse<Report[]>>('/reports/trending', {
            params: { limit }
        });
        return response.data;
    },

    voteReport: async (id: number, type: 'upvote' | 'downvote'): Promise<ApiResponse<any>> => {
        // API uses loai_binh_chon: 1 (upvote) or -1 (downvote)
        const loai_binh_chon = type === 'upvote' ? 1 : -1;
        const response = await api.post<ApiResponse<any>>(`/reports/${id}/vote`, { loai_binh_chon });
        return response.data;
    },

    incrementView: async (id: number): Promise<ApiResponse<void>> => {
        const response = await api.post<ApiResponse<void>>(`/reports/${id}/view`);
        return response.data;
    },

    rateReport: async (id: number, rating: number): Promise<ApiResponse<void>> => {
        // API uses diem_so (1-5 stars)
        const response = await api.post<ApiResponse<void>>(`/reports/${id}/rate`, {
            diem_so: rating
        });
        return response.data;
    },

    getStats: async (): Promise<ApiResponse<any>> => {
        const response = await api.get<ApiResponse<any>>('/reports/stats');
        return response.data;
    },

    addComment: async (reportId: number, content: string): Promise<ApiResponse<any>> => {
        const response = await api.post<ApiResponse<any>>(`/reports/${reportId}/comments`, {
            noi_dung: content
        });
        return response.data;
    },
};

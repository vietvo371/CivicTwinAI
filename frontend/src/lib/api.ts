import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
  errors?: Record<string, unknown | string[]>;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Tự động Toast nếu đây là các method POST, PUT, PATCH, DELETE báo success
    const method = response.config.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      if (response.data?.success && response.data?.message) {
        toast.success(response.data.message);
      }
    }
    // Giữ nguyên cấu trúc AxiosResponse để code cũ xài res.data.data vẫn chạy
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // Fallback cho network error / cors
    if (!error.response) {
      toast.error('Lỗi kết nối đến máy chủ. Vui lòng kiểm tra lại mạng!');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const message = data?.message || 'Có lỗi xảy ra từ hệ thống.';

    switch (status) {
      case 401:
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          localStorage.removeItem('token');
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          window.location.href = '/login';
        }
        break;
      case 403:
        toast.error(message || 'Bạn không có quyền thực hiện thao tác này.');
        break;
      case 404:
        toast.error(message || 'Dữ liệu không tồn tại.');
        break;
      case 422:
        toast.error(message || 'Dữ liệu đầu vào không hợp lệ.');
        // Nếu muốn in chi tiết lỗi form: 
        // if (data?.errors) { const firstErr = Object.values(data.errors)[0][0]; toast.error(firstErr); }
        break;
      case 500:
        toast.error('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
        break;
      default:
        toast.error(message);
        break;
    }

    return Promise.reject(error);
  }
);

export default api;

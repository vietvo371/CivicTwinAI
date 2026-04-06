import api, { API_BASE_URL } from '../utils/Api';
import { LoginRequest, LoginResponse, RegisterRequest, User, ChangePasswordRequest, ResetPasswordRequest, UpdateProfileRequest } from '../types/api/auth';
import { ApiResponse } from '../types/api/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@auth_token';
const USER_KEY = '@user_data';

export const authService = {
  apiUrl: API_BASE_URL,

  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Đăng nhập thất bại');
    }

    const data = response.data.data;
    if (data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
    }
    if (data.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  },

  register: async (data: RegisterRequest): Promise<void> => {
    await api.post('/auth/register', data);
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore error on logout
    } finally {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    }
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  },

  getToken: async (): Promise<string | null> => {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  getUser: async (): Promise<User | null> => {
    const json = await AsyncStorage.getItem(USER_KEY);
    return json ? JSON.parse(json) : null;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put<ApiResponse<{ user: User }>>('/profile', data);

    if (response.data.success && response.data.data) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
      return response.data.data.user;
    }

    throw new Error('Cập nhật thông tin thất bại');
  },

  changePassword: async (data: any): Promise<void> => {
    // Backend expects: current_password, new_password, new_password_confirmation
    // Mobile code may send different keys (e.g. mat_khau_cu/mat_khau_moi... or password/new naming).
    let payload: Record<string, any>;

    if (data?.mat_khau_cu && data?.mat_khau_moi) {
      payload = {
        current_password: data.mat_khau_cu,
        new_password: data.mat_khau_moi,
        new_password_confirmation:
          data.mat_khau_moi_confirmation ?? data.new_password_confirmation ?? data.password_confirmation,
      };
    } else if (data?.current_password && data?.password) {
      payload = {
        current_password: data.current_password,
        new_password: data.password,
        new_password_confirmation: data.password_confirmation ?? data.new_password_confirmation,
      };
    } else if (data?.current_password && data?.new_password) {
      payload = {
        current_password: data.current_password,
        new_password: data.new_password,
        new_password_confirmation: data.new_password_confirmation,
      };
    } else {
      // Fallback: pass-through (in case payload already matches backend format)
      payload = data;
    }

    await api.post('/auth/change-password', payload);
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },

  updateFcmToken: async (fcmToken: string): Promise<void> => {
    await api.post('/auth/update-fcm-token', { fcm_token: fcmToken });
  },

  refreshToken: async (): Promise<string> => {
    const response = await api.post<ApiResponse<{ token: string }>>('/auth/refresh');

    if (response.data.success && response.data.data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, response.data.data.token);
      return response.data.data.token;
    }

    throw new Error('Làm mới token thất bại');
  },

  // NOTE: BE reset/OTP/email verify chưa được triển khai đồng bộ trong dự án hiện tại.
  // Stub này chỉ để TypeScript compile được; nếu gọi thật sẽ báo chưa implement.
  verifyEmail: async (_code: string): Promise<void> => {
    throw new Error('Verify email endpoint is not implemented on backend yet');
  },
};

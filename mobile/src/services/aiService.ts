import api from '../utils/Api';
import { ApiResponse } from '../types/api/common';

export interface AIParseResult {
  type?: 'accident' | 'congestion' | 'construction' | 'weather' | 'other';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  summary?: string;
  title?: string;
  error?: string;
  message?: string;
}

/** Kết quả Groq Vision — cùng schema với web `POST /ai/analyze-image`. */
export interface AIVisionResult {
  type?: string;
  severity?: string;
  description?: string;
  confidence?: number;
  /** BE: ảnh rỗng / không parse được — kèm user_hint */
  unclear?: boolean;
  user_hint?: string;
}

const devLogAI = (tag: string, body: unknown) => {
  if (__DEV__) {
    try {
      console.log(`${tag}`, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
    } catch {
      console.log(tag, body);
    }
  }
};

export const aiService = {
  parseReport: async (text: string): Promise<ApiResponse<AIParseResult>> => {
    const response = await api.post<ApiResponse<AIParseResult>>('/ai/parse-report', { text });
    const body = response.data;
    devLogAI('[aiService] POST /ai/parse-report ← BE (full JSON):', body);
    return body;
  },

  /** Vision có thể chậm (Groq); RN cần transformRequest để không stringify FormData. */
  analyzeImage: async (formData: FormData): Promise<ApiResponse<AIVisionResult>> => {
    const response = await api.post<ApiResponse<AIVisionResult>>('/ai/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
      transformRequest: () => formData,
    });
    const body = response.data;
    devLogAI('[aiService] POST /ai/analyze-image ← BE (full JSON):', body);
    return body;
  },
};

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_URL } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { ApiErrorBody } from '@/types/common';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{ accessToken: string }>(`${API_URL}/auth/refreshtoken`, {
      refreshToken,
    });
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    useAuthStore.getState().clearSession();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      refreshPromise = refreshPromise ?? refreshAccessToken();
      const newAccessToken = await refreshPromise;
      refreshPromise = null;

      if (newAccessToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.') {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    if (Array.isArray(body?.message)) return body.message.join('\n');
    if (typeof body?.message === 'string') return body.message;
  }
  return fallback;
}

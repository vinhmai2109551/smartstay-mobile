import axios, { AxiosError, create, isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import { t } from 'i18next';

import { API_URL } from '@/config/env';
import '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { ApiErrorBody } from '@/types/common';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// withCredentials lets the (web) browser send/store the httpOnly refresh_token
// cookie the backend sets on /auth/login, /auth/register, /auth/google and
// /auth/refresh (see doc/API.md 0.2). On native, cookies are handled by the
// OS network stack regardless of this flag.
export const apiClient = create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
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
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      `${API_URL}/auth/refresh`,
      undefined,
      { withCredentials: true },
    );
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

      if (!refreshPromise) {
        // Nulled only once, by whichever call started the refresh — not by every
        // caller that merely awaited the shared promise (that let a caller which
        // settled a hair after the others start a redundant second refresh).
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback?: string) {
  if (isAxiosError<ApiErrorBody>(error)) {
    // The body's own message always wins when there is one, whatever the status/code.
    const body = error.response?.data;
    if (Array.isArray(body?.message)) return body.message.join('\n');
    if (typeof body?.message === 'string') return body.message;

    // No body to read a message from — classify what actually happened instead of
    // falling straight to the generic fallback.
    if (error.code === 'ERR_NETWORK') return t('common.errorNetwork');
    if (error.code === 'ECONNABORTED') return t('common.errorTimeout');
    if (error.response && error.response.status >= 500) return t('common.errorServer');
  }
  return fallback ?? t('common.errorFallback');
}

import { AxiosError, create, isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import { t } from 'i18next';

import { API_URL } from '@/config/env';
import '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { ApiErrorBody } from '@/types/common';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const REQUEST_TIMEOUT_MS = 15000;

// withCredentials lets the (web) browser send/store the httpOnly refresh_token
// cookie the backend sets on /auth/login, /auth/register, /auth/google and
// /auth/refresh. On native, cookies are handled by the OS network stack
// regardless of this flag.
const clientConfig = {
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
};

export const apiClient = create(clientConfig);

// /auth/refresh goes through its own instance: it must NOT pass through apiClient's
// interceptors (no stale Authorization header, no recursive 401 handling), but it still
// needs the same timeout — a bare `axios.post` has none, so a hung connection would freeze
// every request queued behind the shared refresh promise.
export const refreshClient = create(clientConfig);

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// Auth endpoints answer 401 for reasons a new access token cannot fix (wrong password,
// bad/expired OTP, invalid Google token), so they are never retried after a refresh.
// /auth/me is the exception: it is an ordinary authenticated call (JwtAuthGuard) that must
// survive an expired access token, e.g. on app launch.
const REFRESHABLE_AUTH_PATHS = ['/auth/me'];

function isRefreshable(url: string | undefined) {
  if (!url) return false;
  return !url.startsWith('/auth/') || REFRESHABLE_AUTH_PATHS.includes(url);
}

// Only a definitive answer from the server ends the session: it rejected the refresh
// token itself (expired, revoked or missing). A network error, a timeout or a 5xx says
// nothing about the token's validity, so those must not sign the guest out.
function isSessionRejected(error: unknown) {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  try {
    const { data } = await refreshClient.post<{ accessToken: string }>('/auth/refresh');
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
  } catch (error) {
    if (isSessionRejected(error)) useAuthStore.getState().clearSession();
    // Rethrown either way: callers get the real failure (e.g. ERR_NETWORK, which
    // getApiErrorMessage turns into a "check your connection" message) rather than
    // the original request's now-misleading 401.
    throw error;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      isRefreshable(originalRequest.url)
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        // Nulled only once, by whichever call started the refresh — not by every
        // caller that merely awaited the shared promise (that let a caller which
        // settled a hair after the others start a redundant second refresh).
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      let newAccessToken: string;
      try {
        newAccessToken = await refreshPromise;
      } catch (refreshError) {
        // A rejected refresh token has already cleared the session (-> login screen);
        // a transient failure keeps it, and this request just fails so the user can retry.
        return Promise.reject(refreshError);
      }

      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
      return apiClient(originalRequest);
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

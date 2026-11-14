import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { apiClient, getApiErrorMessage, refreshClient } from './client';
import vi from '@/i18n/locales/vi.json';
import { useAuthStore } from '@/store/authStore';

// axios.isAxiosError only checks for this one marker property (see
// node_modules/axios/lib/helpers/isAxiosError.js), so a plain object is enough.
function fakeAxiosError(overrides: Record<string, unknown> = {}) {
  return { isAxiosError: true, ...overrides };
}

describe('getApiErrorMessage', () => {
  it('joins an array message from the response body with newlines', () => {
    const error = fakeAxiosError({
      response: { status: 400, data: { message: ['Email không hợp lệ', 'Số điện thoại không hợp lệ'] } },
    });
    expect(getApiErrorMessage(error)).toBe('Email không hợp lệ\nSố điện thoại không hợp lệ');
  });

  it('returns a string message from the response body as-is', () => {
    const error = fakeAxiosError({ response: { status: 400, data: { message: 'Mã không hợp lệ' } } });
    expect(getApiErrorMessage(error)).toBe('Mã không hợp lệ');
  });

  it('prefers the body message even on a 5xx status', () => {
    const error = fakeAxiosError({ response: { status: 500, data: { message: 'Chi tiết lỗi cụ thể' } } });
    expect(getApiErrorMessage(error)).toBe('Chi tiết lỗi cụ thể');
  });

  it('returns the given fallback for a non-Axios error', () => {
    expect(getApiErrorMessage(new Error('boom'), 'Lỗi tuỳ chỉnh')).toBe('Lỗi tuỳ chỉnh');
  });

  it('falls back to the generic message for a non-Axios error with no fallback given', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBe(vi.common.errorFallback);
  });

  it('classifies ERR_NETWORK when the body has no message', () => {
    const error = fakeAxiosError({ code: 'ERR_NETWORK' });
    expect(getApiErrorMessage(error)).toBe(vi.common.errorNetwork);
  });

  it('classifies ECONNABORTED (timeout) when the body has no message', () => {
    const error = fakeAxiosError({ code: 'ECONNABORTED' });
    expect(getApiErrorMessage(error)).toBe(vi.common.errorTimeout);
  });

  it('classifies a 5xx response with no message as a server error', () => {
    const error = fakeAxiosError({ response: { status: 503, data: {} } });
    expect(getApiErrorMessage(error)).toBe(vi.common.errorServer);
  });
});

// --- Token refresh -----------------------------------------------------------------
// Both axios instances get a fake adapter, so no request leaves the test and every
// status / network failure the interceptor has to cope with can be scripted exactly.

function reply(config: InternalAxiosRequestConfig, status: number, data: unknown = {}): Promise<AxiosResponse> {
  const response = { data, status, statusText: '', headers: {}, config } as AxiosResponse;
  if (status >= 200 && status < 300) return Promise.resolve(response);
  return Promise.reject(
    new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response),
  );
}

function networkError(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  return Promise.reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config));
}

describe('apiClient token refresh', () => {
  let api: jest.Mock;
  let refresh: jest.Mock;

  beforeEach(() => {
    useAuthStore.setState({ accessToken: 'old-token', user: null });
    api = jest.fn();
    refresh = jest.fn();
    apiClient.defaults.adapter = api;
    refreshClient.defaults.adapter = refresh;
  });

  it('refreshes once and retries the request with the new token after a 401', async () => {
    api
      .mockImplementationOnce((config) => reply(config, 401))
      .mockImplementationOnce((config) => reply(config, 200, { ok: true }));
    refresh.mockImplementation((config) => reply(config, 200, { accessToken: 'new-token' }));

    const response = await apiClient.get('/bookings');

    expect(response.data).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(api.mock.calls[1][0].headers.get('Authorization')).toBe('Bearer new-token');
    expect(useAuthStore.getState().accessToken).toBe('new-token');
  });

  it('sends the refresh request without the expired access token', async () => {
    api.mockImplementationOnce((config) => reply(config, 401)).mockImplementationOnce((config) => reply(config, 200));
    refresh.mockImplementation((config) => reply(config, 200, { accessToken: 'new-token' }));

    await apiClient.get('/bookings');

    expect(refresh.mock.calls[0][0].headers.get('Authorization')).toBeFalsy();
  });

  it('shares one refresh between concurrent 401s', async () => {
    api.mockImplementation((config) =>
      config.headers.get('Authorization') === 'Bearer old-token' ? reply(config, 401) : reply(config, 200),
    );
    refresh.mockImplementation(async (config) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return reply(config, 200, { accessToken: 'new-token' });
    });

    await Promise.all([apiClient.get('/bookings'), apiClient.get('/notifications')]);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not loop when the retried request is rejected again', async () => {
    api.mockImplementation((config) => reply(config, 401));
    refresh.mockImplementation((config) => reply(config, 200, { accessToken: 'new-token' }));

    await expect(apiClient.get('/bookings')).rejects.toMatchObject({ response: { status: 401 } });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledTimes(2);
  });

  it('signs the guest out when the server rejects the refresh token', async () => {
    api.mockImplementation((config) => reply(config, 401));
    refresh.mockImplementation((config) => reply(config, 401));

    await expect(apiClient.get('/bookings')).rejects.toMatchObject({ response: { status: 401 } });

    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('keeps the session when the refresh fails on the network, and surfaces that error', async () => {
    api.mockImplementation((config) => reply(config, 401));
    refresh.mockImplementation((config) => networkError(config));

    const error = await apiClient.get('/bookings').catch((e) => e);

    expect(getApiErrorMessage(error)).toBe(vi.common.errorNetwork);
    expect(useAuthStore.getState().accessToken).toBe('old-token');
  });

  it('keeps the session when the refresh endpoint answers with a 5xx', async () => {
    api.mockImplementation((config) => reply(config, 401));
    refresh.mockImplementation((config) => reply(config, 503));

    await expect(apiClient.get('/bookings')).rejects.toBeDefined();

    expect(useAuthStore.getState().accessToken).toBe('old-token');
  });

  it('never refreshes after a 401 from a credential endpoint such as login', async () => {
    api.mockImplementation((config) => reply(config, 401, { message: 'Email hoặc mật khẩu không đúng' }));

    await expect(apiClient.post('/auth/login', {})).rejects.toMatchObject({ response: { status: 401 } });

    expect(refresh).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBe('old-token');
  });

  it('does refresh after a 401 from /auth/me (expired token at app launch)', async () => {
    api
      .mockImplementationOnce((config) => reply(config, 401))
      .mockImplementationOnce((config) => reply(config, 200, { userId: 'u1' }));
    refresh.mockImplementation((config) => reply(config, 200, { accessToken: 'new-token' }));

    const response = await apiClient.get('/auth/me');

    expect(response.data).toEqual({ userId: 'u1' });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('gives the refresh client the same timeout as the main client', () => {
    expect(refreshClient.defaults.timeout).toBeGreaterThan(0);
    expect(refreshClient.defaults.timeout).toBe(apiClient.defaults.timeout);
  });
});

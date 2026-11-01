import { getApiErrorMessage } from './client';
import vi from '@/i18n/locales/vi.json';

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

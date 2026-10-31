import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as api from '@/services/api.service';
import { clearSession, setToken } from '@/services/session';

const { get, post, requestUse } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  requestUse: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      get,
      post,
      interceptors: { request: { use: requestUse }, response: { use: vi.fn() } },
    }),
    isAxiosError: (err: unknown) => Boolean((err as { isAxiosError?: boolean })?.isAxiosError),
  },
}));

// Captured at import time, before any test clears the mock call history.
const [requestInterceptor] = requestUse.mock.calls[0] as [
  (config: { headers: Record<string, string> }) => { headers: Record<string, string> },
];

describe('api.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSession();
  });

  test('sendOtp posts the phone number to /auth/send-otp', async () => {
    post.mockResolvedValue({
      data: { success: true, message: 'OTP sent', expiresInSeconds: 300, resendInSeconds: 30 },
    });

    const result = await api.sendOtp('+919876544821');

    expect(post).toHaveBeenCalledWith('/auth/send-otp', { phone: '+919876544821' });
    expect(result.resendInSeconds).toBe(30);
  });

  test('verifyOtp posts the phone and code to /auth/verify-otp', async () => {
    post.mockResolvedValue({
      data: {
        success: true,
        token: 'jwt-1',
        user: { id: 'u1', name: 'Sp', phone: '+919876544821', role: 'user', isNewUser: false },
      },
    });

    const result = await api.verifyOtp('+919876544821', '482161');

    expect(post).toHaveBeenCalledWith('/auth/verify-otp', { phone: '+919876544821', otp: '482161' });
    expect(result.token).toBe('jwt-1');
  });

  test('fetchGroups reads /groups and unwraps the data envelope', async () => {
    const data = { summary: { totalSavings: 96000, contributionsCount: 3 }, groups: [] };
    get.mockResolvedValue({ data: { success: true, data } });

    await expect(api.fetchGroups()).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith('/groups');
  });

  test('fetchAlerts sends the selected category as a query parameter', async () => {
    const data = { categories: [], items: [] };
    get.mockResolvedValue({ data: { success: true, data } });

    await api.fetchAlerts('winners');

    expect(get).toHaveBeenCalledWith('/alerts', { params: { category: 'winners' } });
  });

  test('fetchProfile reads /user/profile and unwraps the data envelope', async () => {
    const data = { id: 'u1', name: 'Sp' };
    get.mockResolvedValue({ data: { success: true, data } });

    await expect(api.fetchProfile()).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith('/user/profile');
  });

  test('the request interceptor adds the bearer token when signed in', () => {
    setToken('jwt-abc');

    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer jwt-abc');
  });

  test('errorMessage returns the backend message when there is one', () => {
    const err = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { data: { success: false, message: 'Invalid OTP' } },
    });

    expect(api.errorMessage(err)).toBe('Invalid OTP');
  });

  test('errorMessage explains a network failure', () => {
    const err = Object.assign(new Error('Network Error'), { isAxiosError: true, response: undefined });

    expect(api.errorMessage(err)).toBe('Cannot reach the server. Check your connection.');
  });
});

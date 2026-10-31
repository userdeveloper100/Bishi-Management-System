import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as api from '@/services/api.service';
import { clearSession, getToken, setToken } from '@/services/session';
import { useAuthStore } from '@/stores/auth';
import { useGroupsStore } from '@/stores/groups';

vi.mock('@/services/api.service', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  fetchMe: vi.fn(),
  fetchGroups: vi.fn(),
  fetchAlerts: vi.fn(),
  fetchProfile: vi.fn(),
  errorMessage: vi.fn(),
}));

const PHONE = '+919876544821';
const user = { id: 'u1', name: 'Sp', phone: PHONE, role: 'user', permissions: [] };
const superAdmin = { id: 's1', name: 'Super', phone: '+911234567892', role: 'super_admin', permissions: [] };

/** An error shaped like an Axios error with an HTTP status. */
function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status } });
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    clearSession();
    vi.clearAllMocks();
  });

  test('starts logged out with no pending phone', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(store.pendingPhone).toBeNull();
  });

  test('requestOtp sends the number and remembers it for verification', async () => {
    vi.mocked(api.sendOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent',
      expiresInSeconds: 300,
      resendInSeconds: 30,
    });
    const store = useAuthStore();

    const result = await store.requestOtp(PHONE);

    expect(api.sendOtp).toHaveBeenCalledWith(PHONE);
    expect(store.pendingPhone).toBe(PHONE);
    expect(result.resendInSeconds).toBe(30);
    expect(store.isAuthenticated).toBe(false);
  });

  test('verifyOtp stores the token and user, then clears the pending phone', async () => {
    vi.mocked(api.verifyOtp).mockResolvedValue({ success: true, token: 'jwt-123', user });
    const store = useAuthStore();
    store.pendingPhone = PHONE;

    await store.verifyOtp('482161');

    expect(api.verifyOtp).toHaveBeenCalledWith(PHONE, '482161');
    expect(store.isAuthenticated).toBe(true);
    expect(store.user).toEqual(user);
    expect(store.pendingPhone).toBeNull();
    expect(getToken()).toBe('jwt-123');
  });

  test('verifyOtp without a requested number fails before calling the API', async () => {
    const store = useAuthStore();

    await expect(store.verifyOtp('123456')).rejects.toThrow('Enter your phone number first.');
    expect(api.verifyOtp).not.toHaveBeenCalled();
  });

  test('a wrong code leaves the user signed out and keeps the number pending', async () => {
    vi.mocked(api.verifyOtp).mockRejectedValue(new Error('Invalid OTP'));
    const store = useAuthStore();
    store.pendingPhone = PHONE;

    await expect(store.verifyOtp('000000')).rejects.toThrow('Invalid OTP');
    expect(store.isAuthenticated).toBe(false);
    expect(store.pendingPhone).toBe(PHONE);
    expect(getToken()).toBeNull();
  });

  test('logout clears the token, user and pending phone', async () => {
    vi.mocked(api.verifyOtp).mockResolvedValue({ success: true, token: 'jwt-123', user });
    const store = useAuthStore();
    store.pendingPhone = PHONE;
    await store.verifyOtp('123456');

    store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(store.pendingPhone).toBeNull();
    expect(getToken()).toBeNull();
  });

  test('a saved token loads the signed-in user, including the role, from the server', async () => {
    setToken('saved-jwt');
    vi.mocked(api.fetchMe).mockResolvedValue(superAdmin);
    const store = useAuthStore();

    await store.restoreSession();

    expect(api.fetchMe).toHaveBeenCalledTimes(1);
    expect(store.user?.role).toBe('super_admin');
    expect(store.isAuthenticated).toBe(true);
  });

  test('a token the server rejects is cleared, so the sign-in screen is available again', async () => {
    setToken('stale-jwt');
    vi.mocked(api.fetchMe).mockRejectedValue(httpError(401));
    const store = useAuthStore();

    await store.restoreSession();

    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(getToken()).toBeNull();
  });

  test('a network failure keeps the token, so the next navigation can try again', async () => {
    setToken('saved-jwt');
    vi.mocked(api.fetchMe).mockRejectedValue(new Error('Network Error'));
    const store = useAuthStore();

    await store.restoreSession();

    expect(store.isAuthenticated).toBe(true);
    expect(store.user).toBeNull();
    expect(getToken()).toBe('saved-jwt');
  });

  test('restoring does nothing when there is no token or the user is already loaded', async () => {
    const store = useAuthStore();
    await store.restoreSession();
    expect(api.fetchMe).not.toHaveBeenCalled();

    setToken('saved-jwt');
    store.user = user;
    await store.restoreSession();
    expect(api.fetchMe).not.toHaveBeenCalled();
  });

  test('simultaneous restores share one request', async () => {
    setToken('saved-jwt');
    vi.mocked(api.fetchMe).mockResolvedValue(superAdmin);
    const store = useAuthStore();

    await Promise.all([store.restoreSession(), store.restoreSession(), store.restoreSession()]);

    expect(api.fetchMe).toHaveBeenCalledTimes(1);
  });

  test('logout clears data loaded for the previous user', () => {
    const groups = useGroupsStore();
    groups.groups = [
      {
        id: 'g1',
        name: 'Test Bhishi',
        memberCount: 8,
        cycleMonths: 10,
        monthlyContribution: 32000,
        status: 'BIDDING',
        nextBid: null,
        role: 'owner',
      },
    ];
    const store = useAuthStore();

    store.logout();

    expect(groups.groups).toEqual([]);
  });
});

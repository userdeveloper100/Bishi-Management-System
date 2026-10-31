import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as api from '@/services/api.service';
import { clearSession, getToken } from '@/services/session';
import { useAuthStore } from '@/stores/auth';
import { useGroupsStore } from '@/stores/groups';

vi.mock('@/services/api.service', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  fetchGroups: vi.fn(),
  fetchAlerts: vi.fn(),
  fetchProfile: vi.fn(),
  errorMessage: vi.fn(),
}));

const PHONE = '+919876544821';
const user = { id: 'u1', name: 'Sp', phone: PHONE, role: 'user', isNewUser: false };

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

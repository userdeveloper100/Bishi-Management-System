// @vitest-environment node
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as authApi from '@/api/auth';
import { clearSession, getToken } from '@/api/session';
import { useAuthStore } from '@/stores/auth';

vi.mock('@/api/auth');

// Minimal localStorage so the store can run without a DOM environment.
const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

const user = { id: 'u1', name: 'Test User', email: 'test@example.com', role: 'user' };

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    clearSession();
    vi.clearAllMocks();
  });

  test('starts logged out', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
  });

  test('login stores the token and user', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'jwt-123', user });
    const store = useAuthStore();

    await store.login('test@example.com', 'secret');

    expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'secret');
    expect(store.isAuthenticated).toBe(true);
    expect(store.user).toEqual(user);
    expect(getToken()).toBe('jwt-123');
  });

  test('a failed login leaves the store logged out', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid email or password'));
    const store = useAuthStore();

    await expect(store.login('test@example.com', 'wrong')).rejects.toThrow();
    expect(store.isAuthenticated).toBe(false);
    expect(getToken()).toBeNull();
  });

  test('register creates the account and then logs in', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ id: 'u1', name: 'Test User', email: 'test@example.com' });
    vi.mocked(authApi.login).mockResolvedValue({ token: 'jwt-456', user });
    const store = useAuthStore();

    await store.register('Test User', 'test@example.com', 'secret');

    expect(authApi.register).toHaveBeenCalledWith('Test User', 'test@example.com', 'secret');
    expect(store.isAuthenticated).toBe(true);
  });

  test('logout clears the token and user', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'jwt-123', user });
    const store = useAuthStore();
    await store.login('test@example.com', 'secret');

    store.logout();

    expect(store.isAuthenticated).toBe(false);
    expect(store.user).toBeNull();
    expect(getToken()).toBeNull();
  });
});

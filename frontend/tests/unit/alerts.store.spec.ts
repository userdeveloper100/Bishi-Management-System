import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import * as api from '@/services/api.service';
import type { AlertItem } from '@/services/api.service';
import { useAlertsStore } from '@/stores/alerts';

vi.mock('@/services/api.service', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  fetchGroups: vi.fn(),
  fetchAlerts: vi.fn(),
  fetchProfile: vi.fn(),
  errorMessage: vi.fn(() => 'Something went wrong. Please try again.'),
}));

const item = (id: string, read: boolean): AlertItem => ({
  id,
  type: 'ROUND_OPEN',
  title: `Alert ${id}`,
  body: '',
  groupName: 'Test Bhishi',
  read,
  createdAt: new Date().toISOString(),
});

describe('alerts store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(api.fetchAlerts).mockResolvedValue({ categories: [], items: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('fetch loads items for the active category', async () => {
    vi.mocked(api.fetchAlerts).mockResolvedValue({
      categories: [{ key: 'all', label: 'All', count: 2 }],
      items: [item('a', false), item('b', true)],
    });
    const store = useAlertsStore();

    await store.fetch();

    expect(api.fetchAlerts).toHaveBeenCalledWith('all');
    expect(store.items).toHaveLength(2);
    expect(store.unreadCount).toBe(1);
  });

  test('setCategory switches the filter and refetches', async () => {
    const store = useAlertsStore();

    await store.setCategory('winners');

    expect(store.active).toBe('winners');
    expect(api.fetchAlerts).toHaveBeenCalledWith('winners');
  });

  test('a failed fetch keeps the store usable and records the message', async () => {
    vi.mocked(api.fetchAlerts).mockRejectedValue(new Error('network'));
    const store = useAlertsStore();

    await store.fetch();

    expect(store.error).toBe('Something went wrong. Please try again.');
    expect(store.loading).toBe(false);
  });

  test('startPolling refetches on each interval until stopPolling', async () => {
    vi.useFakeTimers();
    const store = useAlertsStore();

    store.startPolling(1000);
    await vi.advanceTimersByTimeAsync(2500);
    expect(api.fetchAlerts).toHaveBeenCalledTimes(2);

    store.stopPolling();
    await vi.advanceTimersByTimeAsync(5000);
    expect(api.fetchAlerts).toHaveBeenCalledTimes(2);
  });

  test('starting polling twice does not double the refresh rate', async () => {
    vi.useFakeTimers();
    const store = useAlertsStore();

    store.startPolling(1000);
    store.startPolling(1000);
    await vi.advanceTimersByTimeAsync(1000);

    expect(api.fetchAlerts).toHaveBeenCalledTimes(1);
    store.stopPolling();
  });
});

import { defineStore } from 'pinia';

import * as api from '@/services/api.service';
import type { AlertCategory, AlertCategoryCount, AlertItem } from '@/services/api.service';

/** How often the activity feed refreshes while it is open. */
export const ALERTS_POLL_INTERVAL_MS = 30_000;

// Kept outside reactive state: a timer handle is not something the UI renders.
let pollTimer: ReturnType<typeof setInterval> | null = null;

interface AlertsState {
  active: AlertCategory;
  categories: AlertCategoryCount[];
  items: AlertItem[];
  loading: boolean;
  error: string;
}

export const useAlertsStore = defineStore('alerts', {
  state: (): AlertsState => ({
    active: 'all',
    categories: [],
    items: [],
    loading: false,
    error: '',
  }),

  getters: {
    unreadCount: (state): number => state.items.filter((item) => !item.read).length,
  },

  actions: {
    async fetch(): Promise<void> {
      this.loading = true;
      this.error = '';
      try {
        const data = await api.fetchAlerts(this.active);
        this.categories = data.categories;
        this.items = data.items;
      } catch (err) {
        this.error = api.errorMessage(err);
      } finally {
        this.loading = false;
      }
    },

    async setCategory(category: AlertCategory): Promise<void> {
      this.active = category;
      await this.fetch();
    },

    /** Keeps the feed fresh while the Alerts tab is on screen. */
    startPolling(intervalMs = ALERTS_POLL_INTERVAL_MS): void {
      this.stopPolling();
      pollTimer = setInterval(() => {
        void this.fetch();
      }, intervalMs);
    },

    stopPolling(): void {
      if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    },
  },
});

import { defineStore } from 'pinia';

import * as api from '@/services/api.service';
import type { GroupSummary, GroupsData } from '@/services/api.service';

interface GroupsState {
  summary: GroupsData['summary'];
  groups: GroupSummary[];
  loading: boolean;
  error: string;
  loaded: boolean;
}

export const useGroupsStore = defineStore('groups', {
  state: (): GroupsState => ({
    summary: { totalSavings: 0, contributionsCount: 0 },
    groups: [],
    loading: false,
    error: '',
    loaded: false,
  }),

  actions: {
    async fetch(): Promise<void> {
      this.loading = true;
      this.error = '';
      try {
        const data = await api.fetchGroups();
        this.summary = data.summary;
        this.groups = data.groups;
        this.loaded = true;
      } catch (err) {
        this.error = api.errorMessage(err);
      } finally {
        this.loading = false;
      }
    },
  },
});

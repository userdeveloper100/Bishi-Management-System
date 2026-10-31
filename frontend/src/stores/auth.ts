import { defineStore } from 'pinia';

import * as authApi from '@/api/auth';
import type { SessionUser } from '@/api/auth';
import { clearSession, getToken, setToken } from '@/api/session';

interface AuthState {
  token: string | null;
  user: SessionUser | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: getToken(),
    user: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.token !== null,
  },

  actions: {
    async login(email: string, password: string): Promise<void> {
      const { token, user } = await authApi.login(email, password);
      setToken(token);
      this.token = token;
      this.user = user;
    },

    async register(name: string, email: string, password: string): Promise<void> {
      await authApi.register(name, email, password);
      await this.login(email, password);
    },

    logout(): void {
      clearSession();
      this.token = null;
      this.user = null;
    },
  },
});

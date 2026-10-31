import axios from 'axios';
import { defineStore } from 'pinia';

import * as api from '@/services/api.service';
import type { AuthUser } from '@/services/api.service';
import { clearSession, getToken, setToken } from '@/services/session';
import { useAlertsStore } from '@/stores/alerts';
import { useGroupsStore } from '@/stores/groups';
import { useProfileStore } from '@/stores/profile';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** E.164 number waiting for an OTP. Set after send-otp, cleared after verify. */
  pendingPhone: string | null;
}

/** One check at a time, so several navigations at startup share a single request. */
let restoring: Promise<void> | null = null;

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: getToken(),
    user: null,
    pendingPhone: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.token !== null,
  },

  actions: {
    /** Step 1 of sign-in: ask the backend to send an OTP to this number. */
    async requestOtp(phone: string): Promise<{ resendInSeconds: number }> {
      const res = await api.sendOtp(phone);
      this.pendingPhone = phone;
      return { resendInSeconds: res.resendInSeconds };
    },

    /** Step 2 of sign-in: verify the OTP and store the session. */
    async verifyOtp(otp: string): Promise<void> {
      if (!this.pendingPhone) {
        throw new Error('Enter your phone number first.');
      }
      const { token, user } = await api.verifyOtp(this.pendingPhone, otp);
      setToken(token);
      this.token = token;
      this.user = user;
      this.pendingPhone = null;
    },

    /**
     * Load the signed-in user (with their role) from the server when the app opens with a saved token.
     * A token the server rejects is cleared, so the sign-in screen is available again.
     * A network failure keeps the token; the next navigation tries again.
     */
    restoreSession(): Promise<void> {
      if (!this.token || this.user) return Promise.resolve();
      if (!restoring) {
        restoring = (async () => {
          try {
            this.user = await api.fetchMe();
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              this.logout();
            }
          } finally {
            restoring = null;
          }
        })();
      }
      return restoring;
    },

    logout(): void {
      clearSession();
      this.token = null;
      this.user = null;
      this.pendingPhone = null;
      // Drop data loaded for the previous user.
      useGroupsStore().$reset();
      useAlertsStore().$reset();
      useProfileStore().$reset();
    },
  },
});

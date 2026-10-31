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

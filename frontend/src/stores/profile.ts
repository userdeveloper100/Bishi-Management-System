import { defineStore } from 'pinia';

import { type AppLocale, i18n, isAppLocale, setAppLocale, currentAppLocale } from '@/i18n';
import * as api from '@/services/api.service';
import type { ProfileData } from '@/services/api.service';

interface ProfileState {
  profile: ProfileData | null;
  loading: boolean;
  error: string;
  savingLanguage: boolean;
  languageError: string;
}

export const useProfileStore = defineStore('profile', {
  state: (): ProfileState => ({
    profile: null,
    loading: false,
    error: '',
    savingLanguage: false,
    languageError: '',
  }),

  actions: {
    async fetch(): Promise<void> {
      this.loading = true;
      this.error = '';
      try {
        const profile = await api.fetchProfile();
        this.profile = profile;
        // The saved language wins over whatever this device last used.
        if (isAppLocale(profile.language)) setAppLocale(profile.language);
      } catch (err) {
        this.error = api.errorMessage(err);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Change the UI language straight away, then save it to the server.
     * If saving fails, the previous language and profile are restored.
     */
    async setLanguage(language: AppLocale): Promise<void> {
      const previousLocale = currentAppLocale();
      const previousProfile = this.profile;

      this.languageError = '';
      setAppLocale(language);
      if (this.profile) this.profile = { ...this.profile, language };

      this.savingLanguage = true;
      try {
        this.profile = await api.updateProfile({ language });
      } catch {
        setAppLocale(previousLocale);
        this.profile = previousProfile;
        this.languageError = i18n.global.t('language.saveFailed');
      } finally {
        this.savingLanguage = false;
      }
    },
  },
});

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { i18n } from '@/i18n';
import * as api from '@/services/api.service';
import type { ProfileData } from '@/services/api.service';
import { useProfileStore } from '@/stores/profile';

vi.mock('@/services/api.service', () => ({
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
  errorMessage: vi.fn(),
}));

const PROFILE: ProfileData = {
  id: 'u1',
  name: 'Asha Patil',
  initials: 'AP',
  phone: '+919876544821',
  phoneVerified: true,
  email: null,
  upiId: null,
  language: 'en',
  pro: { active: false, planName: null, price: null, currency: 'INR', period: null },
};

describe('profile store language', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
    i18n.global.locale.value = 'en';
  });

  test('fetch switches the UI to the language saved on the profile', async () => {
    vi.mocked(api.fetchProfile).mockResolvedValue({ ...PROFILE, language: 'hi' });
    const store = useProfileStore();

    await store.fetch();

    expect(i18n.global.locale.value).toBe('hi');
  });

  test('setLanguage changes the UI at once, then saves to the server', async () => {
    vi.mocked(api.fetchProfile).mockResolvedValue(PROFILE);
    const store = useProfileStore();
    await store.fetch();

    let finishSave: (value: ProfileData) => void = () => undefined;
    vi.mocked(api.updateProfile).mockReturnValue(new Promise((resolve) => (finishSave = resolve)));

    const pending = store.setLanguage('mr');

    expect(i18n.global.locale.value).toBe('mr');
    expect(store.profile?.language).toBe('mr');
    expect(store.savingLanguage).toBe(true);

    finishSave({ ...PROFILE, language: 'mr' });
    await pending;

    expect(api.updateProfile).toHaveBeenCalledWith({ language: 'mr' });
    expect(store.savingLanguage).toBe(false);
    expect(store.languageError).toBe('');
    expect(localStorage.getItem('bhishipay.locale')).toBe('mr');
  });

  test('setLanguage restores the previous language when saving fails', async () => {
    vi.mocked(api.fetchProfile).mockResolvedValue(PROFILE);
    const store = useProfileStore();
    await store.fetch();
    vi.mocked(api.updateProfile).mockRejectedValue(new Error('network'));

    await store.setLanguage('hi');

    expect(i18n.global.locale.value).toBe('en');
    expect(store.profile?.language).toBe('en');
    expect(store.languageError).toBe("Couldn't save your language. Try again.");
    expect(store.savingLanguage).toBe(false);
  });
});

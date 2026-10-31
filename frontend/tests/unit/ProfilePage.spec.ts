import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import * as api from '@/services/api.service';
import { useAuthStore } from '@/stores/auth';
import ProfilePage from '@/views/tabs/ProfilePage.vue';

vi.mock('@/services/api.service', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  fetchMe: vi.fn(),
  fetchGroups: vi.fn(),
  fetchAlerts: vi.fn(),
  fetchProfile: vi.fn(),
  updateProfile: vi.fn(),
  errorMessage: vi.fn(),
}));

// Run the Ionic enter hook right away; there is no Ionic page lifecycle in jsdom.
// Navigation goes through vue-router, as in the shared test setup.
vi.mock('@ionic/vue', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const { useRouter } = await import('vue-router');
  return {
    ...actual,
    onIonViewWillEnter: (callback: () => void) => callback(),
    useIonRouter: () => {
      const router = useRouter();
      return {
        navigate: (location: string, _direction?: string, action?: string) =>
          action === 'replace' ? router.replace(location) : router.push(location),
        back: () => router.back(),
      };
    },
  };
});

const PROFILE = {
  id: 'u1',
  name: 'Super Admin',
  initials: 'SA',
  phone: '+911234567892',
  phoneVerified: true,
  email: null,
  upiId: null,
  language: 'en',
  pro: { active: true, planName: 'Pro', price: null, currency: 'INR' as const, period: null },
};

function routerFor() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/admin/super-admin', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div />' } },
    ],
  });
}

async function mountAs(role: string) {
  const router = routerFor();
  await router.push('/');
  const auth = useAuthStore();
  auth.token = 'jwt';
  auth.user = { id: 'u1', name: 'Test', phone: PROFILE.phone, role, permissions: [] };
  vi.mocked(api.fetchProfile).mockResolvedValue(PROFILE);

  const wrapper = mount(ProfilePage, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

describe('ProfilePage master settings link', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  test('a Super Admin sees the Master settings link, pointing at the master screens', async () => {
    const wrapper = await mountAs('super_admin');

    const link = wrapper.find('[data-testid="master-settings-link"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe('/admin/super-admin');
  });

  test('other roles do not see the Master settings link', async () => {
    const wrapper = await mountAs('admin');

    expect(wrapper.find('[data-testid="master-settings-link"]').exists()).toBe(false);
  });

  test('the link appears from the role alone, even while the profile is still loading', async () => {
    const router = routerFor();
    await router.push('/');
    const auth = useAuthStore();
    auth.token = 'jwt';
    auth.user = { id: 'u1', name: 'Test', phone: PROFILE.phone, role: 'super_admin', permissions: [] };
    vi.mocked(api.fetchProfile).mockReturnValue(new Promise(() => undefined));

    const wrapper = mount(ProfilePage, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.find('[data-testid="master-settings-link"]').exists()).toBe(true);
  });
});

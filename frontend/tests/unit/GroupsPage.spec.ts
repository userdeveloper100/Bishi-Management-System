import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import * as api from '@/services/api.service';
import GroupsPage from '@/views/tabs/GroupsPage.vue';

vi.mock('@/services/api.service', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  fetchGroups: vi.fn(),
  fetchAlerts: vi.fn(),
  fetchProfile: vi.fn(),
  errorMessage: vi.fn(),
}));

// Run the Ionic enter hook right away; there is no Ionic page lifecycle in jsdom.
vi.mock('@ionic/vue', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, onIonViewWillEnter: (callback: () => void) => callback() };
});

const passthrough = (name: string) =>
  defineComponent({
    name,
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.()),
  });

// Mirrors ion-modal: render its content only while open.
const modalStub = defineComponent({
  props: { isOpen: Boolean },
  setup(props, { slots }) {
    return () => (props.isOpen ? h('div', { role: 'dialog' }, slots.default?.()) : null);
  },
});

const Blank = defineComponent({ render: () => h('div') });

const groupsData = {
  summary: { totalSavings: 125000, contributionsCount: 4 },
  groups: [
    {
      id: 'g1',
      name: 'Ganesh Bhishi',
      memberCount: 12,
      cycleMonths: 12,
      monthlyContribution: 5000,
      status: 'BIDDING',
      nextBid: { round: 3, at: '2026-11-01T13:30:00.000Z' },
      role: 'owner',
    },
  ],
};

const profileData = {
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

async function mountGroups() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Blank },
      { path: '/tabs/alerts', component: Blank },
      { path: '/tabs/profile', component: Blank },
    ],
  });
  await router.push('/');
  const wrapper = mount(GroupsPage, {
    global: {
      plugins: [router],
      stubs: {
        IonPage: passthrough('IonPage'),
        IonContent: passthrough('IonContent'),
        'ion-icon': true,
        'ion-modal': modalStub,
      },
    },
  });
  await flushPromises();
  return wrapper;
}

describe('GroupsPage actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(api.fetchGroups).mockResolvedValue(groupsData);
    vi.mocked(api.fetchProfile).mockResolvedValue(profileData);
    vi.mocked(api.fetchAlerts).mockResolvedValue({ categories: [], items: [] });
  });

  test('the + button opens the create-group modal and Got it closes it', async () => {
    const wrapper = await mountGroups();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

    await wrapper.get('button[aria-label="Create a group"]').trigger('click');

    expect(wrapper.get('[role="dialog"]').text()).toContain('Create a group');
    expect(wrapper.get('[role="dialog"]').text()).toContain("Creating a group isn't available yet");

    await wrapper.get('[role="dialog"] button').trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  test('Add Members opens the modal for that group only', async () => {
    const wrapper = await mountGroups();

    await wrapper.get('[data-testid="add-members"]').trigger('click');

    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.text()).toContain('Add members');
    expect(dialog.text()).toContain('Ganesh Bhishi');
  });
});

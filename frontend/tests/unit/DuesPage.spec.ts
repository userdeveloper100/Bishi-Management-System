import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import * as api from '@/services/api.service';
import DuesPage from '@/views/admin/DuesPage.vue';

vi.mock('@/services/api.service', () => ({
  fetchDues: vi.fn(),
  generateDues: vi.fn(),
  markDuePaid: vi.fn(),
  fetchGroups: vi.fn(),
  errorMessage: vi.fn(),
}));

// Run the Ionic enter hook right away; there is no Ionic page lifecycle in jsdom.
vi.mock('@ionic/vue', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, onIonViewWillEnter: (callback: () => unknown) => callback() };
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

const GROUP = {
  id: 'g1',
  name: 'Ganesh Bhishi',
  memberCount: 3,
  cycleMonths: 12,
  monthlyContribution: 5000,
  status: 'BIDDING',
  nextBid: null,
  role: 'owner',
};

const pendingDue: api.Due = {
  id: 'd1',
  groupId: 'g1',
  userId: 'u1',
  period: '2026-11',
  amount: 5000,
  status: 'PENDING',
  method: null,
  paidAt: null,
  user: { id: 'u1', name: 'Asha Patil', phone: '+919876544821' },
};

const paidDue: api.Due = {
  ...pendingDue,
  id: 'd2',
  userId: 'u2',
  status: 'PAID',
  method: 'CASH',
  paidAt: '2026-11-02T10:00:00.000Z',
  user: { id: 'u2', name: 'Ravi Kumar', phone: '+919876500000' },
};

async function mountDues() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/tabs/groups', component: Blank },
      { path: '/admin/groups/:groupId/dues', component: Blank },
    ],
  });
  await router.push('/admin/groups/g1/dues');
  const wrapper = mount(DuesPage, {
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

describe('DuesPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(api.fetchGroups).mockResolvedValue({
      summary: { totalSavings: 0, contributionsCount: 0 },
      groups: [GROUP],
    } as unknown as api.GroupsData);
    vi.mocked(api.fetchDues).mockResolvedValue([pendingDue, paidDue]);
    vi.mocked(api.errorMessage).mockImplementation(() => 'Something went wrong. Please try again.');
  });

  test('lists pending dues separately from paid ones, with the pending total', async () => {
    const wrapper = await mountDues();

    expect(api.fetchDues).toHaveBeenCalledWith('g1');
    expect(wrapper.text()).toContain('Asha Patil');
    expect(wrapper.get('[data-testid="pending-total"]').text()).toContain('₹5,000');
    expect(wrapper.text()).toContain('Ravi Kumar');
  });

  test('marking a due paid asks for the method first, then records it and moves the due to paid', async () => {
    vi.mocked(api.markDuePaid).mockResolvedValue({ ...pendingDue, status: 'PAID', method: 'UPI' });
    const wrapper = await mountDues();

    const markButton = wrapper.findAll('button').find((b) => b.text() === 'Mark paid');
    await markButton!.trigger('click');

    const dialog = wrapper.get('[role="dialog"]');
    expect(dialog.text()).toContain('Record payment');
    expect(dialog.text()).toContain('Asha Patil');

    const upi = wrapper.findAll('[role="dialog"] button').find((b) => b.text() === 'UPI');
    await upi!.trigger('click');
    const confirm = wrapper.findAll('[role="dialog"] button').find((b) => b.text() === 'Confirm payment');
    await confirm!.trigger('click');
    await flushPromises();

    expect(api.markDuePaid).toHaveBeenCalledWith('d1', 'UPI');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  test('creating dues uses the group monthly contribution for the current month', async () => {
    vi.mocked(api.generateDues).mockResolvedValue({ period: '2026-11', created: 3 });
    const wrapper = await mountDues();

    const generate = wrapper.findAll('button').find((b) => b.text().startsWith('Create dues for'));
    await generate!.trigger('click');
    await flushPromises();

    expect(api.generateDues).toHaveBeenCalledWith('g1', expect.stringMatching(/^\d{4}-\d{2}$/), 5000);
    expect(wrapper.text()).toContain('3 dues created');
  });
});

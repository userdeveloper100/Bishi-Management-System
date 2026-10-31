import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import * as api from '@/services/api.service';
import LoginPage from '@/views/LoginPage.vue';

vi.mock('@/services/api.service', () => ({
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  fetchGroups: vi.fn(),
  fetchAlerts: vi.fn(),
  fetchProfile: vi.fn(),
  errorMessage: vi.fn(),
}));

// Ionic page wrappers are passed through; they need the Ionic runtime otherwise.
const passthrough = (name: string) =>
  defineComponent({
    name,
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.()),
  });

const Blank = defineComponent({ render: () => h('div') });

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: Blank },
      { path: '/otp', component: Blank },
    ],
  });
}

async function mountLogin() {
  const router = makeRouter();
  await router.push('/login');
  const wrapper = mount(LoginPage, {
    global: {
      plugins: [router],
      stubs: {
        IonPage: passthrough('IonPage'),
        IonContent: passthrough('IonContent'),
        'ion-icon': true,
      },
    },
  });
  return { wrapper, router };
}

describe('LoginPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(api.errorMessage).mockImplementation((err) => (err instanceof Error ? err.message : 'Error'));
  });

  test('asks for a valid 10-digit number and does not call the API for a short one', async () => {
    const { wrapper } = await mountLogin();

    await wrapper.get('input#mobile').setValue('12345');
    await wrapper.get('form').trigger('submit');

    expect(wrapper.get('[role="alert"]').text()).toBe('Enter a valid 10-digit mobile number.');
    expect(api.sendOtp).not.toHaveBeenCalled();
  });

  test('ignores non-digit characters before sending', async () => {
    vi.mocked(api.sendOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent',
      expiresInSeconds: 300,
      resendInSeconds: 30,
    });
    const { wrapper } = await mountLogin();

    await wrapper.get('input#mobile').setValue('98765 43210');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(api.sendOtp).toHaveBeenCalledWith('+919876543210');
  });

  test('sends the OTP with the +91 prefix and moves to the OTP screen', async () => {
    vi.mocked(api.sendOtp).mockResolvedValue({
      success: true,
      message: 'OTP sent',
      expiresInSeconds: 300,
      resendInSeconds: 30,
    });
    const { wrapper, router } = await mountLogin();

    await wrapper.get('input#mobile').setValue('9876544821');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(api.sendOtp).toHaveBeenCalledWith('+919876544821');
    expect(router.currentRoute.value.path).toBe('/otp');
  });

  test('shows the server message when the OTP cannot be sent', async () => {
    vi.mocked(api.sendOtp).mockRejectedValue(new Error('Too many requests. Try again later.'));
    const { wrapper, router } = await mountLogin();

    await wrapper.get('input#mobile').setValue('9876544821');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toBe('Too many requests. Try again later.');
    expect(router.currentRoute.value.path).toBe('/login');
  });
});

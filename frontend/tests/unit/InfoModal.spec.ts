import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { defineComponent, h } from 'vue';

import InfoModal from '@/components/InfoModal.vue';

// ion-modal needs the Ionic runtime; render its content only while open, as the real component does.
const modalStub = defineComponent({
  props: { isOpen: Boolean },
  setup(props, { slots }) {
    return () => (props.isOpen ? h('div', { role: 'dialog' }, slots.default?.()) : null);
  },
});

function mountModal(props: Partial<InstanceType<typeof InfoModal>['$props']> = {}) {
  return mount(InfoModal, {
    props: { open: true, title: 'Create a group', ...props },
    slots: { default: '<p>Coming soon</p>' },
    global: { stubs: { 'ion-modal': modalStub, 'ion-icon': true } },
  });
}

describe('InfoModal', () => {
  test('shows the title, subtitle and slot content when open', () => {
    const wrapper = mountModal({ subtitle: 'Start a new circle' });

    expect(wrapper.get('h2').text()).toBe('Create a group');
    expect(wrapper.text()).toContain('Start a new circle');
    expect(wrapper.text()).toContain('Coming soon');
  });

  test('renders nothing when closed', () => {
    const wrapper = mountModal({ open: false });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  test('uses "Got it" by default and emits close when it is pressed', async () => {
    const wrapper = mountModal();

    const button = wrapper.get('button');
    expect(button.text()).toBe('Got it');
    await button.trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  test('accepts a custom close label', () => {
    const wrapper = mountModal({ closeLabel: 'Maybe later' });

    expect(wrapper.get('button').text()).toBe('Maybe later');
  });
});

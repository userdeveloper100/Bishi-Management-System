import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';

import OtpBoxes from '@/components/OtpBoxes.vue';

function mountBoxes(modelValue = '') {
  return mount(OtpBoxes, {
    props: { modelValue, 'onUpdate:modelValue': () => {} },
    attachTo: document.body,
  });
}

function boxes(wrapper: ReturnType<typeof mountBoxes>) {
  return wrapper.findAll('input');
}

describe('OtpBoxes', () => {
  test('renders six boxes by default', () => {
    const wrapper = mountBoxes();
    expect(boxes(wrapper)).toHaveLength(6);
    wrapper.unmount();
  });

  test('typing a digit emits the new code and moves focus to the next box', async () => {
    const wrapper = mountBoxes();

    await boxes(wrapper)[0].setValue('4');

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['4']);
    expect(document.activeElement).toBe(boxes(wrapper)[1].element);
    wrapper.unmount();
  });

  test('non-digit input is ignored and leaves the code unchanged', async () => {
    const wrapper = mountBoxes();

    await boxes(wrapper)[0].setValue('a');

    expect(boxes(wrapper)[0].element.value).toBe('');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    wrapper.unmount();
  });

  test('emits complete once all six digits are entered', async () => {
    const wrapper = mountBoxes();

    for (const [index, digit] of ['1', '2', '3', '4', '5', '6'].entries()) {
      await boxes(wrapper)[index].setValue(digit);
    }

    expect(wrapper.emitted('complete')).toEqual([['123456']]);
    wrapper.unmount();
  });

  test('pasting a full code fills every box', async () => {
    const wrapper = mountBoxes();

    await boxes(wrapper)[0].setValue('123456');

    expect(boxes(wrapper).map((input) => input.element.value)).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(wrapper.emitted('complete')).toEqual([['123456']]);
    wrapper.unmount();
  });

  test('backspace in an empty box clears the previous box and moves back', async () => {
    const wrapper = mountBoxes('123');

    await boxes(wrapper)[3].trigger('keydown', { key: 'Backspace' });

    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['12']);
    expect(document.activeElement).toBe(boxes(wrapper)[2].element);
    wrapper.unmount();
  });

  test('shows the value passed in from the parent', () => {
    const wrapper = mountBoxes('482');
    expect(boxes(wrapper).map((input) => input.element.value)).toEqual(['4', '8', '2', '', '', '']);
    wrapper.unmount();
  });
});

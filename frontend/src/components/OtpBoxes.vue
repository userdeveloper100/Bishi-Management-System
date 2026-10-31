<template>
  <div class="flex items-center justify-between gap-2" role="group" :aria-label="$t('otp.oneTimeCode')">
    <input
      v-for="(digit, index) in slots"
      :key="index"
      :ref="(el) => setInput(el as HTMLInputElement | null, index)"
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      :aria-label="$t('otp.digitOf', { index: index + 1, length })"
      :value="digit"
      :disabled="disabled"
      class="h-14 w-full min-w-0 rounded-2xl border border-slate-200 bg-white text-center text-[22px] font-semibold text-midnight shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition focus:border-champagne focus:ring-2 focus:ring-champagne/20 disabled:opacity-60"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @focus="($event.target as HTMLInputElement).select()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    length?: number;
    disabled?: boolean;
  }>(),
  { length: 6, disabled: false },
);

const model = defineModel<string>({ default: '' });

const emit = defineEmits<{
  complete: [code: string];
}>();

const slots = ref<string[]>(Array.from({ length: props.length }, () => ''));
const inputs: (HTMLInputElement | null)[] = [];

// Keep the boxes in sync when the parent sets or clears the value.
watch(
  model,
  (value) => {
    if (value !== slots.value.join('')) {
      slots.value = Array.from({ length: props.length }, (_, i) => value[i] ?? '');
    }
  },
  { immediate: true },
);

function setInput(el: HTMLInputElement | null, index: number) {
  inputs[index] = el;
}

function focusBox(index: number) {
  const target = inputs[index];
  if (target) {
    target.focus();
    target.select();
  }
}

function commit() {
  const code = slots.value.join('');
  model.value = code;
  if (slots.value.every(Boolean)) {
    emit('complete', code);
  }
}

function onInput(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const typed = target.value.replace(/\D/g, '');
  const isPaste = typed.length > 1 && !slots.value[index];
  const last = props.length - 1;

  if (typed === '') {
    slots.value[index] = '';
  } else if (isPaste) {
    // Paste or autofill into an empty box: fill from here onwards.
    for (let i = 0; i < typed.length && index + i <= last; i++) {
      slots.value[index + i] = typed[i];
    }
  } else {
    // Typing over a filled box keeps the newest digit.
    slots.value[index] = typed.slice(-1);
  }

  // Keep the DOM in step with the slot in case the browser kept a stray character.
  target.value = slots.value[index];

  if (typed !== '') {
    focusBox(isPaste ? Math.min(index + typed.length, last) : Math.min(index + 1, last));
  }

  commit();
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !slots.value[index] && index > 0) {
    event.preventDefault();
    slots.value[index - 1] = '';
    focusBox(index - 1);
    commit();
  }
}
</script>

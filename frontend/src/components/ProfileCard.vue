<template>
  <section
    class="flex items-center gap-4 rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
  >
    <div
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-champagne-light/40 text-[17px] font-semibold text-champagne-dark"
      aria-hidden="true"
    >
      {{ initials }}
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-[17px] font-semibold text-midnight">{{ name }}</p>
      <p class="text-[14px] text-slate-500">{{ maskedPhone }}</p>
    </div>
    <button
      type="button"
      class="flex flex-col items-center gap-0.5 px-1 text-[12px] text-slate-600"
      :aria-label="$t('profile.editAria')"
      @click="emit('edit')"
    >
      <ion-icon name="pencil-outline" class="text-[16px]" aria-hidden="true" />
      {{ $t('profile.edit') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { initialsOf, maskPhone } from '@/utils/format';

const props = defineProps<{
  name: string;
  /** E.164 phone number, for example +919876544821. */
  phone: string;
}>();

const emit = defineEmits<{
  edit: [];
}>();

const initials = computed(() => initialsOf(props.name));
const maskedPhone = computed(() => maskPhone(props.phone));
</script>

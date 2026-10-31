<template>
  <section class="d-flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-card">
    <div
      class="d-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-champagne-light-40 fs-17 fw-semibold text-champagne-dark"
      aria-hidden="true"
    >
      {{ initials }}
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate fs-17 fw-semibold text-midnight">{{ name }}</p>
      <p class="fs-14 text-slate-500">{{ maskedPhone }}</p>
    </div>
    <button
      type="button"
      class="d-flex flex-col items-center gap-0-5 px-1 fs-12 text-slate-600"
      :aria-label="$t('profile.editAria')"
      @click="emit('edit')"
    >
      <ion-icon name="pencil-outline" class="fs-16" aria-hidden="true" />
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

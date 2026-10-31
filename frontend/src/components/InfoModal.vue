<template>
  <ion-modal :is-open="open" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.9]" @did-dismiss="emit('close')">
    <div class="bg-pearl px-6 pb-10 pt-4" role="dialog" :aria-label="title">
      <div class="mx-auto h-1 w-10 rounded-full bg-slate-300" aria-hidden="true" />

      <div class="mt-6 d-flex items-start gap-4">
        <div
          class="d-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-champagne-light-40 text-champagne-dark"
          aria-hidden="true"
        >
          <ion-icon :name="icon" class="fs-22" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="fs-20 fw-semibold tracking-tight text-midnight">{{ title }}</h2>
          <p v-if="subtitle" class="mt-1 fs-14 text-slate-500">{{ subtitle }}</p>
        </div>
      </div>

      <div class="mt-6 fs-15 lh-relaxed text-slate-600">
        <slot />
      </div>

      <button
        type="button"
        class="mt-8 w-full rounded-2xl bg-midnight py-4 fs-15 fw-semibold text-white"
        @click="emit('close')"
      >
        {{ closeLabel ?? t('common.gotIt') }}
      </button>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    subtitle?: string;
    icon?: string;
    /** Leave unset for the translated "Got it" label. */
    closeLabel?: string;
  }>(),
  {
    subtitle: '',
    icon: 'information-circle-outline',
    closeLabel: undefined,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const { t } = useI18n();
</script>

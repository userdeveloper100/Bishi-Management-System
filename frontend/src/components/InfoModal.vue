<template>
  <ion-modal :is-open="open" :initial-breakpoint="0.6" :breakpoints="[0, 0.6, 0.9]" @did-dismiss="emit('close')">
    <div class="bg-pearl px-6 pb-10 pt-4" role="dialog" :aria-label="title">
      <div class="mx-auto h-1 w-10 rounded-full bg-slate-300" aria-hidden="true" />

      <div class="mt-6 flex items-start gap-4">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-champagne-light/40 text-champagne-dark"
          aria-hidden="true"
        >
          <ion-icon :name="icon" class="text-[22px]" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-[20px] font-semibold tracking-tight text-midnight">{{ title }}</h2>
          <p v-if="subtitle" class="mt-1 text-[14px] text-slate-500">{{ subtitle }}</p>
        </div>
      </div>

      <div class="mt-6 text-[15px] leading-relaxed text-slate-600">
        <slot />
      </div>

      <button
        type="button"
        class="mt-8 w-full rounded-2xl bg-midnight py-4 text-[15px] font-semibold text-white"
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

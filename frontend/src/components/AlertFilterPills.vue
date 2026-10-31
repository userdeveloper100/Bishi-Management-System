<template>
  <div class="d-flex gap-2 mx-n5 overflow-x-auto px-5 pb-1" role="tablist" :aria-label="$t('alerts.filterAria')">
    <button
      v-for="option in options"
      :key="option.key"
      type="button"
      role="tab"
      class="bh-pill"
      :class="{ 'bh-pill--active': option.key === modelValue }"
      :aria-selected="option.key === modelValue"
      @click="emit('update:modelValue', option.key)"
    >
      <span v-if="option.icon" class="mr-1" aria-hidden="true">{{ option.icon }}</span>
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { AlertCategory } from '@/services/api.service';

defineProps<{
  modelValue: AlertCategory;
}>();

const emit = defineEmits<{
  'update:modelValue': [category: AlertCategory];
}>();

const { t } = useI18n();

// Icons match the design; the labels come from the active language.
const options = computed<{ key: AlertCategory; label: string; icon?: string }[]>(() => [
  { key: 'all', label: t('alerts.all') },
  { key: 'winners', label: t('alerts.winners'), icon: '🏆' },
  { key: 'members', label: t('alerts.members'), icon: '👥' },
  { key: 'rounds', label: t('alerts.rounds'), icon: '🔔' },
]);
</script>

<template>
  <section>
    <h2 class="mb-2 px-1 fs-12 fw-semibold uppercase tracking-12 text-slate-400">
      {{ title }}
    </h2>
    <ul class="divide-y overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft">
      <li v-for="row in rows" :key="row.id">
        <button type="button" class="bh-row" :aria-label="row.label" @click="emit('select', row.id)">
          <ion-icon :name="row.icon" class="shrink-0 fs-20 text-slate-600" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="fs-15 text-midnight">{{ row.label }}</p>
            <p v-if="row.sublabel" class="fs-13 text-slate-500">{{ row.sublabel }}</p>
          </div>
          <span v-if="row.value" class="fs-13 fw-medium" :class="toneClass(row.tone)">
            {{ row.value }}
          </span>
          <ion-icon name="chevron-forward-outline" class="shrink-0 text-slate-300" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
export type SettingsTone = 'success' | 'action' | 'muted';

export interface SettingsRow {
  /** Stable key for the row. The parent uses it to decide what a tap does, whatever the language. */
  id: string;
  label: string;
  icon: string;
  sublabel?: string;
  value?: string;
  tone?: SettingsTone;
}

defineProps<{
  title: string;
  rows: SettingsRow[];
}>();

const emit = defineEmits<{
  select: [id: string];
}>();

function toneClass(tone: SettingsTone = 'muted'): string {
  switch (tone) {
    case 'success':
      return 'text-mint';
    case 'action':
      return 'text-mint';
    default:
      return 'text-slate-400';
  }
}
</script>

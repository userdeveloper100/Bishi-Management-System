<template>
  <section>
    <h2 class="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-slate-400">
      {{ title }}
    </h2>
    <ul
      class="divide-y divide-slate-100 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
    >
      <li v-for="row in rows" :key="row.id">
        <button
          type="button"
          class="flex w-full items-center gap-4 px-5 py-4 text-left"
          :aria-label="row.label"
          @click="emit('select', row.id)"
        >
          <ion-icon :name="row.icon" class="shrink-0 text-[20px] text-slate-600" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <p class="text-[15px] text-midnight">{{ row.label }}</p>
            <p v-if="row.sublabel" class="text-[13px] text-slate-500">{{ row.sublabel }}</p>
          </div>
          <span v-if="row.value" class="text-[13px] font-medium" :class="toneClass(row.tone)">
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

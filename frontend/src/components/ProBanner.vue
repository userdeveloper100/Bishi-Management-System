<template>
  <button
    type="button"
    class="flex w-full items-center gap-4 rounded-[24px] bg-midnight px-5 py-5 text-left shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
    @click="emit('click')"
  >
    <div
      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-champagne/50 bg-champagne/10 text-champagne-light"
      aria-hidden="true"
    >
      <ion-icon name="crown-outline" class="text-[22px]" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-[16px] font-semibold text-champagne-light">{{ $t('pro.title') }}</p>
      <p class="mt-0.5 text-[13px] text-slate-400">{{ $t('pro.banner') }}</p>
    </div>
    <ion-icon name="chevron-forward-outline" class="text-champagne-light" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  click: [];
}>();
</script>

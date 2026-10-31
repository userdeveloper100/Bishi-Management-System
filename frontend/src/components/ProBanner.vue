<template>
  <button
    type="button"
    class="d-flex w-full items-center gap-4 rounded-3xl bg-midnight px-5 py-5 text-left shadow-lift"
    @click="emit('click')"
  >
    <div
      class="d-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-champagne-50 bg-champagne-10 text-champagne-light"
      aria-hidden="true"
    >
      <ion-icon name="crown-outline" class="fs-22" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="fs-16 fw-semibold text-champagne-light">{{ $t('pro.title') }}</p>
      <p class="mt-0-5 fs-13 text-slate-400">{{ $t('pro.banner') }}</p>
    </div>
    <ion-icon name="chevron-forward-outline" class="text-champagne-light" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  click: [];
}>();
</script>

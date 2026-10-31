<template>
  <section
    class="d-flex items-center justify-between rounded-hero bg-midnight px-6 py-6 text-white shadow-lift"
    :aria-label="$t('hero.savings')"
  >
    <div class="min-w-0">
      <p class="fs-13 text-slate-400">{{ $t('hero.savings') }}</p>
      <p class="mt-1 fs-34 fw-semibold tracking-tight" data-testid="savings-total">
        {{ formatINR(totalSavings) }}
      </p>
      <p class="mt-1 fs-13 text-slate-400">
        {{ $t('hero.contributions', { count: contributions }, contributions) }}. {{ $t('hero.shared') }}
      </p>
    </div>
    <div
      class="d-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-champagne-70 fs-22 fw-semibold text-champagne-light"
      aria-hidden="true"
    >
      ₹
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatINR } from '@/utils/format';

defineProps<{
  totalSavings: number;
  contributions: number;
}>();
</script>

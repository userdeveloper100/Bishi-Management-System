<template>
  <section
    class="flex items-center justify-between rounded-[28px] bg-midnight px-6 py-6 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]"
    :aria-label="$t('hero.savings')"
  >
    <div class="min-w-0">
      <p class="text-[13px] text-slate-400">{{ $t('hero.savings') }}</p>
      <p class="mt-1 text-[34px] font-semibold tracking-tight" data-testid="savings-total">
        {{ formatINR(totalSavings) }}
      </p>
      <p class="mt-1 text-[13px] text-slate-400">
        {{ $t('hero.contributions', { count: contributions }, contributions) }}. {{ $t('hero.shared') }}
      </p>
    </div>
    <div
      class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-champagne/70 text-[22px] font-semibold text-champagne-light"
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

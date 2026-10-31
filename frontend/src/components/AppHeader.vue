<template>
  <header class="flex items-center justify-between">
    <BhishiLogo />
    <router-link
      to="/tabs/profile"
      class="inline-flex items-center gap-1.5 rounded-full border border-champagne/30 bg-champagne-light/35 px-3.5 py-1.5 text-[13px] font-semibold text-champagne-dark"
    >
      <ion-icon name="ribbon-outline" aria-hidden="true" />
      {{ $t('header.getPro') }}
    </router-link>
  </header>
</template>

<script setup lang="ts">
import BhishiLogo from './BhishiLogo.vue';
</script>

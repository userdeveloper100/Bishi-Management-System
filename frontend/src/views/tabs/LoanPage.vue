<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto max-w-400 px-5 pb-40 pt-safe">
        <AppHeader />

        <h1 class="mt-8 fs-30 fw-semibold tracking-tight text-midnight">{{ $t('loan.title') }}</h1>
        <p class="mt-1 fs-14 text-slate-500">{{ $t('loan.subtitle') }}</p>

        <div
          class="mt-8 d-flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
        >
          <ion-icon name="book-outline" class="fs-32 text-champagne-dark" aria-hidden="true" />
          <p class="fs-16 fw-semibold text-midnight">{{ $t('loan.soon') }}</p>
          <p class="fs-14 text-slate-500">{{ $t('loan.body') }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';

import AppHeader from '@/components/AppHeader.vue';
</script>

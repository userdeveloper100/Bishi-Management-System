<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto max-w-[400px] px-5 pb-40 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <AppHeader />

        <h1 class="mt-8 text-[30px] font-semibold tracking-tight text-midnight">{{ $t('loan.title') }}</h1>
        <p class="mt-1 text-[14px] text-slate-500">{{ $t('loan.subtitle') }}</p>

        <div
          class="mt-8 flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
        >
          <ion-icon name="book-outline" class="text-[32px] text-champagne-dark" aria-hidden="true" />
          <p class="text-[16px] font-semibold text-midnight">{{ $t('loan.soon') }}</p>
          <p class="text-[14px] text-slate-500">{{ $t('loan.body') }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';

import AppHeader from '@/components/AppHeader.vue';
</script>

<template>
  <!-- ion-page makes the tabs a page for the app's outlet, so screens shown before them (sign-in, OTP) are removed. -->
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <GlassTabBar />
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonRouterOutlet, IonTabs } from '@ionic/vue';

import GlassTabBar from '@/components/GlassTabBar.vue';
</script>

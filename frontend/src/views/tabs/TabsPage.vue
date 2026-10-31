<template>
  <ion-tabs>
    <ion-router-outlet />
    <GlassTabBar />
  </ion-tabs>
</template>

<script setup lang="ts">
import { IonRouterOutlet, IonTabs } from '@ionic/vue';

import GlassTabBar from '@/components/GlassTabBar.vue';
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Bishi</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onLogout">Log out</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>Welcome, {{ auth.user?.name ?? 'there' }}</h2>
      <p>Your groups and bishis will appear here.</p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

function onLogout() {
  auth.logout();
  router.replace('/login');
}
</script>

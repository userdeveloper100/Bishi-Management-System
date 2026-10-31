<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Log in</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="onSubmit">
        <ion-input v-model="email" type="email" label="Email" label-placement="stacked" fill="outline" autocomplete="email" />
        <ion-input
          v-model="password"
          type="password"
          label="Password"
          label-placement="stacked"
          fill="outline"
          autocomplete="current-password"
          class="ion-margin-top"
        />

        <ion-text v-if="error" color="danger">
          <p role="alert">{{ error }}</p>
        </ion-text>

        <ion-button type="submit" expand="block" class="ion-margin-top" :disabled="busy">
          {{ busy ? 'Logging in…' : 'Log in' }}
        </ion-button>
      </form>

      <p class="ion-text-center">
        No account yet?
        <router-link to="/register">Create one</router-link>
      </p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButton, IonContent, IonHeader, IonInput, IonPage, IonText, IonTitle, IonToolbar } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { errorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function onSubmit() {
  error.value = '';
  busy.value = true;
  try {
    await auth.login(email.value, password.value);
    router.replace('/home');
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

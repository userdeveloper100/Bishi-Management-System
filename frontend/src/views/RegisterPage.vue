<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Create account</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <form @submit.prevent="onSubmit">
        <ion-input v-model="name" label="Name" label-placement="stacked" fill="outline" autocomplete="name" />
        <ion-input
          v-model="email"
          type="email"
          label="Email"
          label-placement="stacked"
          fill="outline"
          autocomplete="email"
          class="ion-margin-top"
        />
        <ion-input
          v-model="password"
          type="password"
          label="Password"
          label-placement="stacked"
          fill="outline"
          autocomplete="new-password"
          class="ion-margin-top"
        />

        <ion-text v-if="error" color="danger">
          <p role="alert">{{ error }}</p>
        </ion-text>

        <ion-button type="submit" expand="block" class="ion-margin-top" :disabled="busy">
          {{ busy ? 'Creating account…' : 'Create account' }}
        </ion-button>
      </form>

      <p class="ion-text-center">
        Already registered?
        <router-link to="/login">Log in</router-link>
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

const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

async function onSubmit() {
  error.value = '';
  busy.value = true;
  try {
    await auth.register(name.value, email.value, password.value);
    router.replace('/home');
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

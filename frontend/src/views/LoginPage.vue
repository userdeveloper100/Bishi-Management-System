<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto d-flex min-h-full max-w-400 flex-col px-6 pb-8 pt-safe">
        <BhishiLogo class="mt-2" />

        <!-- Illustration: concentric rings around the rupee tile -->
        <div class="position-relative mx-auto mt-8 h-60 w-60" aria-hidden="true">
          <div class="position-absolute inset-0 rounded-full border border-slate-200 bg-white-70" />
          <div class="position-absolute inset-6 rounded-full border border-champagne-30" />
          <div class="position-absolute inset-12 rounded-full border border-champagne-20" />
          <div
            class="position-absolute left-50p top-50p translate-center d-flex h-24 w-24 items-center justify-center rounded-hero bg-midnight fs-40 fw-semibold text-white shadow-tile"
          >
            ₹
          </div>
          <div
            class="position-absolute right-2 top-8 d-flex h-11 w-11 items-center justify-center rounded-2xl bg-champagne-light-35 text-champagne-dark"
          >
            <ion-icon name="shield-checkmark-outline" class="fs-20" />
          </div>
          <div
            class="position-absolute left-0 top-58p d-flex items-center gap-1-5 rounded-full bg-white px-3 py-2 fs-12 fw-medium text-slate-700 shadow-sm"
          >
            <ion-icon name="people-outline" />
            {{ $t('login.stronger') }}
          </div>
          <span class="position-absolute bottom-10 right-7 h-2 w-2 rounded-full bg-champagne" />
          <span class="position-absolute left-7 top-12 h-2 w-2 rounded-full bg-champagne" />
        </div>

        <h1 class="mt-8 fs-32 fw-semibold tracking-tight text-midnight">{{ $t('login.title') }}</h1>
        <p class="mt-2 fs-15 text-slate-500">{{ $t('login.subtitle') }}</p>

        <form class="mt-8" novalidate @submit.prevent="onSubmit">
          <label for="mobile" class="fs-13 fw-medium text-slate-600">{{ $t('login.label') }}</label>
          <div class="bh-field mt-2" :class="{ 'bh-field--error': error }">
            <span class="d-flex items-center gap-1 border-r border-slate-200 pl-4 pr-3 fs-15 fw-medium text-midnight">
              +91
              <ion-icon name="chevron-down-outline" class="fs-14 text-slate-400" aria-hidden="true" />
            </span>
            <input
              id="mobile"
              v-model="digits"
              class="bh-field__input"
              type="tel"
              inputmode="numeric"
              autocomplete="tel-national"
              maxlength="10"
              :placeholder="$t('login.placeholder')"
              :aria-invalid="error ? 'true' : 'false'"
              aria-describedby="mobile-help"
              @input="sanitize"
            />
          </div>

          <p v-if="error" id="mobile-help" role="alert" class="mt-2 fs-13 text-red-600">{{ error }}</p>

          <button type="submit" class="bh-btn mt-6" :disabled="busy">
            <span>{{ busy ? $t('login.sending') : $t('login.send') }}</span>
            <ion-icon name="arrow-forward-outline" class="fs-20" aria-hidden="true" />
          </button>
        </form>

        <p class="mt-4 d-flex items-center justify-center gap-1-5 fs-13 text-slate-500">
          <ion-icon name="shield-checkmark-outline" class="text-champagne-dark" aria-hidden="true" />
          {{ $t('login.trust') }}
        </p>

        <p class="mt-auto pt-10 text-center fs-12 lh-relaxed text-slate-500">
          {{ $t('login.legalStart') }}
          <a href="#" class="fw-medium underline underline-offset-2">{{ $t('login.terms') }}</a>
          {{ $t('login.and') }}
          <a href="#" class="fw-medium underline underline-offset-2">{{ $t('login.privacy') }}</a
          >{{ $t('login.legalEnd') }}
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, useIonRouter } from '@ionic/vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import BhishiLogo from '@/components/BhishiLogo.vue';
import { errorMessage } from '@/services/api.service';
import { useAuthStore } from '@/stores/auth';
import { toE164 } from '@/utils/format';

const auth = useAuthStore();
const ionRouter = useIonRouter();
const { t } = useI18n();

/** Digits typed so far, without the +91 prefix. */
const digits = ref('');
const error = ref('');
const busy = ref(false);

function sanitize() {
  digits.value = digits.value.replace(/\D/g, '').slice(0, 10);
}

async function onSubmit() {
  error.value = '';

  const phone = toE164(digits.value);
  if (!phone) {
    error.value = t('login.invalid');
    return;
  }

  busy.value = true;
  try {
    await auth.requestOtp(phone);
    ionRouter.navigate('/otp', 'forward', 'push');
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

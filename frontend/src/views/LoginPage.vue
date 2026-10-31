<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto flex min-h-full max-w-[400px] flex-col px-6 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <BhishiLogo class="mt-2" />

        <!-- Illustration: concentric rings around the rupee tile -->
        <div class="relative mx-auto mt-8 h-60 w-60" aria-hidden="true">
          <div class="absolute inset-0 rounded-full border border-slate-200 bg-white/70" />
          <div class="absolute inset-6 rounded-full border border-champagne/30" />
          <div class="absolute inset-12 rounded-full border border-champagne/20" />
          <div
            class="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[28px] bg-midnight text-[40px] font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.25)]"
          >
            ₹
          </div>
          <div
            class="absolute right-2 top-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-champagne-light/35 text-champagne-dark"
          >
            <ion-icon name="shield-checkmark-outline" class="text-[20px]" />
          </div>
          <div
            class="absolute left-0 top-[58%] flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[12px] font-medium text-slate-700 shadow-sm"
          >
            <ion-icon name="people-outline" />
            {{ $t('login.stronger') }}
          </div>
          <span class="absolute bottom-10 right-7 h-2 w-2 rounded-full bg-champagne" />
          <span class="absolute left-7 top-12 h-2 w-2 rounded-full bg-champagne" />
        </div>

        <h1 class="mt-8 text-[32px] font-semibold tracking-tight text-midnight">{{ $t('login.title') }}</h1>
        <p class="mt-2 text-[15px] text-slate-500">{{ $t('login.subtitle') }}</p>

        <form class="mt-8" novalidate @submit.prevent="onSubmit">
          <label for="mobile" class="text-[13px] font-medium text-slate-600">{{ $t('login.label') }}</label>
          <div
            class="mt-2 flex h-14 items-center rounded-2xl border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-champagne focus-within:ring-2 focus-within:ring-champagne/20"
            :class="error ? 'border-red-300' : 'border-slate-200'"
          >
            <span
              class="flex items-center gap-1 border-r border-slate-200 pl-4 pr-3 text-[15px] font-medium text-midnight"
            >
              +91
              <ion-icon name="chevron-down-outline" class="text-[14px] text-slate-400" aria-hidden="true" />
            </span>
            <input
              id="mobile"
              v-model="digits"
              type="tel"
              inputmode="numeric"
              autocomplete="tel-national"
              maxlength="10"
              :placeholder="$t('login.placeholder')"
              class="h-full min-w-0 flex-1 bg-transparent px-4 text-[16px] text-midnight outline-none placeholder:text-slate-400"
              :aria-invalid="error ? 'true' : 'false'"
              aria-describedby="mobile-help"
              @input="sanitize"
            />
          </div>

          <p v-if="error" id="mobile-help" role="alert" class="mt-2 text-[13px] text-red-600">{{ error }}</p>

          <button
            type="submit"
            class="mt-6 flex h-14 w-full items-center justify-between rounded-2xl bg-midnight px-6 text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] transition disabled:opacity-60"
            :disabled="busy"
          >
            <span>{{ busy ? $t('login.sending') : $t('login.send') }}</span>
            <ion-icon name="arrow-forward-outline" class="text-[20px]" aria-hidden="true" />
          </button>
        </form>

        <p class="mt-4 flex items-center justify-center gap-1.5 text-[13px] text-slate-500">
          <ion-icon name="shield-checkmark-outline" class="text-champagne-dark" aria-hidden="true" />
          {{ $t('login.trust') }}
        </p>

        <p class="mt-auto pt-10 text-center text-[12px] leading-relaxed text-slate-500">
          {{ $t('login.legalStart') }}
          <a href="#" class="font-medium underline underline-offset-2">{{ $t('login.terms') }}</a>
          {{ $t('login.and') }}
          <a href="#" class="font-medium underline underline-offset-2">{{ $t('login.privacy') }}</a
          >{{ $t('login.legalEnd') }}
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import BhishiLogo from '@/components/BhishiLogo.vue';
import { errorMessage } from '@/services/api.service';
import { useAuthStore } from '@/stores/auth';
import { toE164 } from '@/utils/format';

const auth = useAuthStore();
const router = useRouter();
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
    router.push('/otp');
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

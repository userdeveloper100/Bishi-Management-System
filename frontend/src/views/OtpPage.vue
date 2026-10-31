<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto d-flex min-h-full max-w-400 flex-col px-6 pb-8 pt-safe">
        <header class="d-flex items-center justify-between">
          <button
            type="button"
            class="d-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-midnight"
            :aria-label="$t('common.back')"
            @click="router.push('/login')"
          >
            <ion-icon name="arrow-back-outline" class="fs-20" />
          </button>
          <span class="fs-12 uppercase tracking-20 text-slate-500">{{ $t('otp.secure') }}</span>
        </header>

        <div
          class="position-relative mt-10 d-flex h-24 w-24 items-center justify-center rounded-3xl bg-champagne-light-35"
          aria-hidden="true"
        >
          <ion-icon name="phone-portrait-outline" class="fs-40 text-champagne-dark" />
          <span
            class="position-absolute bottom-n1 right-n1 d-flex h-7 w-7 items-center justify-center rounded-full bg-midnight text-white"
          >
            <ion-icon name="checkmark-outline" class="fs-14" />
          </span>
        </div>

        <h1 class="mt-8 fs-32 fw-semibold tracking-tight text-midnight">{{ $t('otp.title') }}</h1>
        <p class="mt-2 fs-15 text-slate-500">{{ $t('otp.sentTo') }}</p>
        <p class="mt-1 fs-16 fw-semibold text-midnight" data-testid="masked-phone">{{ maskedPhone }}</p>
        <button
          type="button"
          class="bh-link mt-1 d-inline-flex w-fit items-center gap-1-5 fs-14"
          @click="router.push('/login')"
        >
          {{ $t('otp.change') }}
          <ion-icon name="pencil-outline" class="fs-14" aria-hidden="true" />
        </button>

        <div class="mt-8">
          <OtpBoxes v-model="code" :disabled="busy" />
        </div>

        <div class="mt-4 d-flex items-center justify-between fs-14">
          <span class="text-slate-500">{{ $t('otp.notReceived') }}</span>
          <button type="button" class="bh-link" :disabled="cooldown > 0 || busy" @click="onResend">
            {{ cooldown > 0 ? $t('otp.resendIn', { seconds: cooldown }) : $t('otp.resend') }}
          </button>
        </div>

        <p v-if="error" role="alert" class="mt-3 fs-14 text-red-600">{{ error }}</p>

        <button type="button" class="bh-btn mt-8" :disabled="code.length !== 6 || busy" @click="onVerify">
          <span>{{ busy ? $t('otp.verifying') : $t('otp.verify') }}</span>
          <ion-icon name="arrow-forward-outline" class="fs-20" aria-hidden="true" />
        </button>

        <p class="mt-4 d-flex items-center justify-center gap-1-5 fs-13 text-slate-500">
          <ion-icon name="shield-checkmark-outline" class="text-champagne-dark" aria-hidden="true" />
          {{ $t('login.trust') }}
        </p>

        <footer class="mt-auto d-flex flex-col items-center gap-2 pt-10 text-center fs-13 text-slate-400">
          <ion-icon name="lock-closed-outline" class="fs-18" aria-hidden="true" />
          {{ $t('otp.private') }}
        </footer>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';
import { computed, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import OtpBoxes from '@/components/OtpBoxes.vue';
import { errorMessage } from '@/services/api.service';
import { useAuthStore } from '@/stores/auth';
import { maskPhone } from '@/utils/format';

const DEFAULT_RESEND_SECONDS = 30;

const auth = useAuthStore();
const router = useRouter();

const code = ref('');
const error = ref('');
const busy = ref(false);
const cooldown = ref(DEFAULT_RESEND_SECONDS);

const maskedPhone = computed(() => (auth.pendingPhone ? maskPhone(auth.pendingPhone) : ''));

let timer: ReturnType<typeof setInterval> | null = null;

function startCooldown(seconds: number) {
  cooldown.value = seconds;
  if (timer !== null) clearInterval(timer);
  timer = setInterval(() => {
    cooldown.value = Math.max(0, cooldown.value - 1);
    if (cooldown.value === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

// The OTP was just sent from the login screen, so start the resend timer now.
startCooldown(DEFAULT_RESEND_SECONDS);

onUnmounted(() => {
  if (timer !== null) clearInterval(timer);
});

async function onVerify() {
  error.value = '';
  busy.value = true;
  try {
    await auth.verifyOtp(code.value);
    router.replace('/tabs/groups');
  } catch (err) {
    error.value = errorMessage(err);
    code.value = '';
  } finally {
    busy.value = false;
  }
}

async function onResend() {
  if (!auth.pendingPhone) return;
  error.value = '';
  busy.value = true;
  try {
    const { resendInSeconds } = await auth.requestOtp(auth.pendingPhone);
    code.value = '';
    startCooldown(resendInSeconds);
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}
</script>

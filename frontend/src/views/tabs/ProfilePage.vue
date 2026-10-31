<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto max-w-[400px] px-5 pb-40 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <AppHeader />

        <h1 class="mt-8 text-[30px] font-semibold tracking-tight text-midnight">{{ $t('profile.title') }}</h1>

        <div v-if="profile.profile" class="mt-6 space-y-6">
          <ProfileCard :name="profile.profile.name" :phone="profile.profile.phone" @edit="editOpen = true" />

          <ProBanner v-if="!profile.profile.pro.active" @click="proOpen = true" />

          <SettingsList :title="$t('profile.accountTitle')" :rows="accountRows" @select="onSelect" />
          <SettingsList :title="$t('profile.settingsTitle')" :rows="communityRows" @select="onSelect" />

          <button
            type="button"
            class="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-[15px] font-medium text-slate-700"
            @click="onLogout"
          >
            <ion-icon name="log-out-outline" aria-hidden="true" />
            {{ $t('profile.logout') }}
          </button>
        </div>

        <p v-else-if="profile.error" role="alert" class="mt-8 text-center text-[14px] text-red-600">
          {{ profile.error }}
        </p>
        <p v-else class="mt-10 text-center text-[14px] text-slate-500">{{ $t('profile.loading') }}</p>
      </div>

      <InfoModal
        :open="proOpen"
        :title="$t('pro.title')"
        :subtitle="$t('pro.subtitle')"
        icon="crown-outline"
        :close-label="$t('common.maybeLater')"
        @close="proOpen = false"
      >
        <ul class="space-y-2">
          <li>{{ $t('pro.benefit1') }}</li>
          <li>{{ $t('pro.benefit2') }}</li>
          <li>{{ $t('pro.benefit3') }}</li>
        </ul>
        <p class="mt-4 font-semibold text-midnight">{{ $t('pro.price') }}</p>
        <p class="mt-1 text-[14px] text-slate-500">{{ $t('pro.notAvailable') }}</p>
      </InfoModal>

      <InfoModal
        :open="editOpen"
        :title="$t('profile.editTitle')"
        :subtitle="$t('profile.editSubtitle')"
        icon="pencil-outline"
        @close="editOpen = false"
      >
        <dl v-if="profile.profile" class="divide-y divide-slate-200 rounded-2xl bg-white px-4">
          <div class="flex justify-between gap-4 py-3">
            <dt class="text-slate-500">{{ $t('profile.name') }}</dt>
            <dd class="truncate font-medium text-midnight">{{ profile.profile.name }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-3">
            <dt class="text-slate-500">{{ $t('profile.email') }}</dt>
            <dd class="truncate font-medium text-midnight">{{ profile.profile.email ?? $t('profile.notAdded') }}</dd>
          </div>
          <div class="flex justify-between gap-4 py-3">
            <dt class="text-slate-500">{{ $t('profile.upi') }}</dt>
            <dd class="truncate font-medium text-midnight">{{ profile.profile.upiId ?? $t('profile.notSet') }}</dd>
          </div>
        </dl>
        <p class="mt-4 text-[14px] text-slate-500">{{ $t('profile.editBody') }}</p>
      </InfoModal>

      <InfoModal
        :open="languageOpen"
        :title="$t('language.pickerTitle')"
        :subtitle="$t('language.pickerSubtitle')"
        icon="language-outline"
        :close-label="$t('common.cancel')"
        @close="closeLanguagePicker"
      >
        <ul class="space-y-2">
          <li v-for="option in LANGUAGE_OPTIONS" :key="option.code">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3 text-left"
              :class="option.code === currentLanguage ? 'border-mint' : 'border-slate-200'"
              :aria-pressed="option.code === currentLanguage"
              :disabled="profile.savingLanguage"
              @click="chooseLanguage(option.code)"
            >
              <span class="font-medium text-midnight">{{ option.name }}</span>
              <ion-icon
                v-if="option.code === currentLanguage"
                name="checkmark-circle"
                class="text-[20px] text-mint"
                aria-hidden="true"
              />
            </button>
          </li>
        </ul>
        <p v-if="profile.languageError" role="alert" class="mt-3 text-[14px] text-red-600">
          {{ profile.languageError }}
        </p>
      </InfoModal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AppHeader from '@/components/AppHeader.vue';
import InfoModal from '@/components/InfoModal.vue';
import ProBanner from '@/components/ProBanner.vue';
import ProfileCard from '@/components/ProfileCard.vue';
import SettingsList, { type SettingsRow } from '@/components/SettingsList.vue';
import { type AppLocale } from '@/i18n';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';

const auth = useAuthStore();
const profile = useProfileStore();
const router = useRouter();
const { t } = useI18n();

// Native names stay the same in every language, so they are listed once here.
const LANGUAGE_OPTIONS: { code: AppLocale; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'mr', name: 'मराठी' },
];

const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(
  LANGUAGE_OPTIONS.map((option) => [option.code, option.name]),
);

const currentLanguage = computed<AppLocale>(() => {
  const code = profile.profile?.language;
  return code === 'hi' || code === 'mr' ? code : 'en';
});

const accountRows = computed<SettingsRow[]>(() => {
  const p = profile.profile;
  if (!p) return [];
  return [
    {
      id: 'phone',
      label: t('profile.phone'),
      icon: 'phone-portrait-outline',
      sublabel: p.phone,
      value: p.phoneVerified ? t('profile.verified') : t('profile.verify'),
      tone: p.phoneVerified ? 'success' : 'action',
    },
    {
      id: 'email',
      label: t('profile.email'),
      icon: 'mail-outline',
      value: p.email ?? t('profile.addEmail'),
      tone: p.email ? 'muted' : 'action',
    },
    {
      id: 'upi',
      label: t('profile.upi'),
      icon: 'card-outline',
      value: p.upiId ?? t('profile.setUp'),
      tone: p.upiId ? 'muted' : 'action',
    },
  ];
});

const communityRows = computed<SettingsRow[]>(() => [
  {
    id: 'language',
    label: t('language.label'),
    icon: 'language-outline',
    value: LANGUAGE_NAMES[currentLanguage.value],
    tone: 'muted',
  },
  { id: 'join', label: t('profile.joinAdmins'), icon: 'people-outline' },
  { id: 'share', label: t('profile.share'), icon: 'share-social-outline' },
]);

onIonViewWillEnter(() => {
  void profile.fetch();
});

const proOpen = ref(false);
const editOpen = ref(false);
const languageOpen = ref(false);

function closeLanguagePicker() {
  languageOpen.value = false;
}

async function chooseLanguage(code: AppLocale) {
  if (code === currentLanguage.value) {
    closeLanguagePicker();
    return;
  }
  await profile.setLanguage(code);
  if (!profile.languageError) closeLanguagePicker();
}

async function onSelect(id: string) {
  if (id === 'language') {
    languageOpen.value = true;
    return;
  }
  if (id === 'share' && typeof navigator !== 'undefined' && 'share' in navigator) {
    await navigator.share({
      title: 'BhishiPay',
      text: t('profile.shareText'),
      url: window.location.origin,
    });
  }
}

function onLogout() {
  auth.logout();
  router.replace('/login');
}
</script>

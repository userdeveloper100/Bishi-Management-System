<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto max-w-400 px-5 pb-40 pt-safe">
        <AppHeader />

        <div class="mt-8 d-flex items-start justify-between gap-4">
          <div class="min-w-0">
            <h1 class="fs-26 fw-semibold tracking-tight text-midnight">
              👋 {{ $t('groups.welcome', { name: firstName }) }}
            </h1>
            <p class="mt-1 fs-14 text-slate-500">{{ $t('groups.tagline') }}</p>
          </div>
          <router-link
            to="/tabs/alerts"
            class="position-relative d-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-midnight"
            :aria-label="$t('header.notifications')"
          >
            <ion-icon name="notifications-outline" class="fs-20" />
            <span
              v-if="alerts.unreadCount > 0"
              class="position-absolute right-2-5 top-2-5 h-2 w-2 rounded-full bg-mint"
            />
          </router-link>
        </div>

        <div class="mt-6">
          <SavingsHeroCard
            :total-savings="groups.summary.totalSavings"
            :contributions="groups.summary.contributionsCount"
          />
        </div>

        <div class="mt-8 d-flex items-center justify-between">
          <div class="d-flex items-center gap-2">
            <h2 class="fs-20 fw-semibold text-midnight">{{ $t('groups.yourGroups') }}</h2>
            <span
              class="rounded-md border border-slate-200 bg-white px-1-5 py-0-5 fs-12 fw-medium text-slate-500"
              data-testid="group-count"
            >
              {{ String(groups.groups.length).padStart(2, '0') }}
            </span>
          </div>
          <button type="button" class="text-slate-500" :aria-label="$t('groups.filter')">
            <ion-icon name="options-outline" class="fs-20" />
          </button>
        </div>

        <div class="mt-4 space-y-4">
          <p v-if="groups.loading && !groups.loaded" class="py-8 text-center fs-14 text-slate-500">
            {{ $t('groups.loading') }}
          </p>
          <p v-else-if="groups.error" role="alert" class="py-4 text-center fs-14 text-red-600">
            {{ groups.error }}
          </p>
          <p
            v-else-if="groups.groups.length === 0"
            class="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center fs-14 text-slate-500"
          >
            {{ $t('groups.empty') }}
          </p>

          <GroupCard v-for="group in groups.groups" :key="group.id" :group="group" @add-members="onAddMembers" />
        </div>

        <div class="mt-8 d-flex items-start gap-3 px-1">
          <ion-icon
            name="shield-checkmark-outline"
            class="mt-0-5 shrink-0 fs-20 text-champagne-dark"
            aria-hidden="true"
          />
          <div>
            <p class="fs-15 fw-semibold text-midnight">{{ $t('groups.trustTitle') }}</p>
            <p class="mt-1 fs-14 lh-relaxed text-slate-500">
              {{ $t('groups.trustBody') }}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        class="position-fixed bottom-28 right-6 z-40 d-flex h-14 w-14 items-center justify-center rounded-full bg-midnight text-white shadow-fab"
        :aria-label="$t('groups.createAria')"
        @click="createOpen = true"
      >
        <ion-icon name="add-outline" class="fs-26" />
      </button>

      <InfoModal
        :open="createOpen"
        :title="$t('groups.createTitle')"
        :subtitle="$t('groups.createSubtitle')"
        icon="people-outline"
        @close="createOpen = false"
      >
        <p>{{ $t('groups.createBody') }}</p>
      </InfoModal>

      <InfoModal
        :open="membersGroup !== null"
        :title="$t('groups.addTitle')"
        :subtitle="membersGroup?.name"
        icon="person-add-outline"
        @close="membersGroup = null"
      >
        <p>{{ $t('groups.addBody', { group: membersGroup?.name ?? $t('groups.thisGroup') }) }}</p>
      </InfoModal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { computed, ref } from 'vue';

import AppHeader from '@/components/AppHeader.vue';
import GroupCard from '@/components/GroupCard.vue';
import InfoModal from '@/components/InfoModal.vue';
import SavingsHeroCard from '@/components/SavingsHeroCard.vue';
import type { GroupSummary } from '@/services/api.service';
import { useAlertsStore } from '@/stores/alerts';
import { useAuthStore } from '@/stores/auth';
import { useGroupsStore } from '@/stores/groups';
import { useProfileStore } from '@/stores/profile';

const auth = useAuthStore();
const groups = useGroupsStore();
const alerts = useAlertsStore();
const profile = useProfileStore();

const firstName = computed(() => {
  const name = profile.profile?.name ?? auth.user?.name ?? '';
  return name.trim().split(/\s+/)[0] || 'there';
});

onIonViewWillEnter(() => {
  void groups.fetch();
  void profile.fetch();
  void alerts.fetch();
});

const createOpen = ref(false);
const membersGroup = ref<GroupSummary | null>(null);

function onAddMembers(groupId: string) {
  membersGroup.value = groups.groups.find((group) => group.id === groupId) ?? null;
}
</script>

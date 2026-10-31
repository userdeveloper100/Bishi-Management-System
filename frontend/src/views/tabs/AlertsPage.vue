<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto max-w-400 px-5 pb-40 pt-safe">
        <AppHeader />

        <div class="mt-8 d-flex items-center justify-between">
          <h1 class="fs-30 fw-semibold tracking-tight text-midnight">{{ $t('alerts.title') }}</h1>
          <span
            v-if="alerts.unreadCount > 0"
            class="rounded-full bg-mint-10 px-3 py-1 fs-13 fw-medium text-mint"
            data-testid="unread-count"
          >
            {{ $t('alerts.newCount', { count: alerts.unreadCount }) }}
          </span>
        </div>
        <p class="mt-1 fs-14 text-slate-500">{{ $t('alerts.subtitle') }}</p>

        <div class="mt-6">
          <AlertFilterPills :model-value="alerts.active" @update:model-value="onFilter" />
        </div>

        <p v-if="alerts.error" role="alert" class="mt-6 text-center fs-14 text-red-600">{{ alerts.error }}</p>
        <p v-else-if="alerts.loading && alerts.items.length === 0" class="mt-10 text-center fs-14 text-slate-500">
          {{ $t('alerts.loading') }}
        </p>
        <p v-else-if="alerts.items.length === 0" class="mt-10 text-center fs-14 text-slate-500">
          {{ $t('alerts.empty') }}
        </p>

        <template v-else>
          <section v-for="group in dayGroups" :key="group.label" class="mt-6">
            <div class="mb-3 d-flex items-center gap-3">
              <span class="fs-12 fw-semibold uppercase tracking-14 text-slate-400">{{ group.label }}</span>
              <span class="h-px flex-1 bg-slate-200" aria-hidden="true" />
            </div>
            <ul class="divide-y rounded-3xl border border-slate-100 bg-white px-5 shadow-card">
              <AlertItemRow v-for="item in group.items" :key="item.id" :item="item" />
            </ul>
          </section>

          <p class="mt-8 d-flex items-center justify-center gap-2 fs-14 text-slate-500">
            <ion-icon name="checkmark-done-outline" class="text-mint" aria-hidden="true" />
            {{ $t('alerts.caughtUp') }}
          </p>
        </template>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, onIonViewWillEnter, onIonViewWillLeave } from '@ionic/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import AlertFilterPills from '@/components/AlertFilterPills.vue';
import AlertItemRow from '@/components/AlertItem.vue';
import AppHeader from '@/components/AppHeader.vue';
import type { AlertCategory } from '@/services/api.service';
import { useAlertsStore } from '@/stores/alerts';
import { groupAlertsByDay } from '@/utils/format';

const alerts = useAlertsStore();
const { t } = useI18n();

const dayGroups = computed(() =>
  groupAlertsByDay(alerts.items, new Date(), { today: t('alerts.today'), yesterday: t('alerts.yesterday') }),
);

function onFilter(category: AlertCategory) {
  void alerts.setCategory(category);
}

// Refresh and poll only while this tab is visible; Ionic keeps tab pages mounted.
onIonViewWillEnter(() => {
  void alerts.fetch();
  alerts.startPolling();
});

onIonViewWillLeave(() => {
  alerts.stopPolling();
});
</script>

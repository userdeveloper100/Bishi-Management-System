<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto max-w-[400px] px-5 pb-40 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <AppHeader />

        <div class="mt-8 flex items-center justify-between">
          <h1 class="text-[30px] font-semibold tracking-tight text-midnight">{{ $t('alerts.title') }}</h1>
          <span
            v-if="alerts.unreadCount > 0"
            class="rounded-full bg-mint/10 px-3 py-1 text-[13px] font-medium text-mint"
            data-testid="unread-count"
          >
            {{ $t('alerts.newCount', { count: alerts.unreadCount }) }}
          </span>
        </div>
        <p class="mt-1 text-[14px] text-slate-500">{{ $t('alerts.subtitle') }}</p>

        <div class="mt-6">
          <AlertFilterPills :model-value="alerts.active" @update:model-value="onFilter" />
        </div>

        <p v-if="alerts.error" role="alert" class="mt-6 text-center text-[14px] text-red-600">{{ alerts.error }}</p>
        <p v-else-if="alerts.loading && alerts.items.length === 0" class="mt-10 text-center text-[14px] text-slate-500">
          {{ $t('alerts.loading') }}
        </p>
        <p v-else-if="alerts.items.length === 0" class="mt-10 text-center text-[14px] text-slate-500">
          {{ $t('alerts.empty') }}
        </p>

        <template v-else>
          <section v-for="group in dayGroups" :key="group.label" class="mt-6">
            <div class="mb-3 flex items-center gap-3">
              <span class="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">{{
                group.label
              }}</span>
              <span class="h-px flex-1 bg-slate-200" aria-hidden="true" />
            </div>
            <ul
              class="divide-y divide-slate-100 rounded-[24px] border border-slate-100 bg-white px-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
            >
              <AlertItemRow v-for="item in group.items" :key="item.id" :item="item" />
            </ul>
          </section>

          <p class="mt-8 flex items-center justify-center gap-2 text-[14px] text-slate-500">
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

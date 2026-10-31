<template>
  <nav
    class="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-[400px] items-center justify-between rounded-[28px] border border-white/70 bg-white/75 px-2 py-2 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl"
    :aria-label="$t('tabs.nav')"
  >
    <router-link
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      :aria-current="isActive(tab.to) ? 'page' : undefined"
      class="flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[12px] font-medium transition-colors"
      :class="isActive(tab.to) ? 'bg-mint/10 text-mint' : 'text-slate-500'"
    >
      <ion-icon :name="tab.icon" class="text-[22px]" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const route = useRoute();
const { t } = useI18n();

const tabs = computed(() => [
  { to: '/tabs/groups', label: t('tabs.groups'), icon: 'people-outline' },
  { to: '/tabs/alerts', label: t('tabs.alerts'), icon: 'notifications-outline' },
  { to: '/tabs/loan', label: t('tabs.loan'), icon: 'book-outline' },
  { to: '/tabs/profile', label: t('tabs.profile'), icon: 'person-outline' },
]);

function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`);
}
</script>

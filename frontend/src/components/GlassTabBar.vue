<template>
  <nav class="bh-tabbar" :aria-label="$t('tabs.nav')">
    <router-link
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="bh-tab"
      :class="{ 'bh-tab--active': isActive(tab.to) }"
      :aria-current="isActive(tab.to) ? 'page' : undefined"
    >
      <ion-icon :name="tab.icon" class="fs-22" aria-hidden="true" />
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

<template>
  <li class="flex gap-4 py-4 first:pt-0 last:pb-0">
    <div
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
      :class="visual.tileClass"
      aria-hidden="true"
    >
      <ion-icon :name="visual.icon" class="text-[20px]" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-start justify-between gap-3">
        <p class="text-[15px] leading-snug text-midnight">
          <span class="font-semibold">{{ item.title }}</span>
        </p>
        <span v-if="!item.read" class="mt-2 h-2 w-2 shrink-0 rounded-full bg-mint" :aria-label="$t('alerts.unread')" />
      </div>
      <p class="mt-1 text-[13px] text-slate-500">{{ item.groupName }} · {{ item.body }}</p>
      <time class="mt-1.5 block text-[12px] text-slate-400" :datetime="item.createdAt">
        {{ time }}
      </time>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { AlertItem, AlertType } from '@/services/api.service';
import { formatTime } from '@/utils/format';

const props = defineProps<{
  item: AlertItem;
}>();

const VISUALS: Record<AlertType, { icon: string; tileClass: string }> = {
  ROUND_OPEN: { icon: 'notifications-outline', tileClass: 'bg-mint/10 text-mint' },
  MEMBER_JOINED: { icon: 'person-add-outline', tileClass: 'bg-slate-100 text-slate-600' },
  WINNER_CONFIRMED: { icon: 'trophy-outline', tileClass: 'bg-champagne-light/35 text-champagne-dark' },
  GROUP_CREATED: { icon: 'add-circle-outline', tileClass: 'bg-champagne-light/35 text-champagne-dark' },
};

const visual = computed(() => VISUALS[props.item.type]);
const time = computed(() => formatTime(props.item.createdAt));
</script>

<template>
  <li class="bh-alert-row">
    <div :class="['bh-tile', visual.tileClass]" aria-hidden="true">
      <ion-icon :name="visual.icon" class="fs-20" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="d-flex items-start justify-between gap-3">
        <p class="fs-15 lh-snug text-midnight">
          <span class="fw-semibold">{{ item.title }}</span>
        </p>
        <span v-if="!item.read" class="mt-2 h-2 w-2 shrink-0 rounded-full bg-mint" :aria-label="$t('alerts.unread')" />
      </div>
      <p class="mt-1 fs-13 text-slate-500">{{ item.groupName }} · {{ item.body }}</p>
      <time class="mt-1-5 d-block fs-12 text-slate-400" :datetime="item.createdAt">
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
  ROUND_OPEN: { icon: 'notifications-outline', tileClass: 'bh-tile--mint' },
  MEMBER_JOINED: { icon: 'person-add-outline', tileClass: 'bh-tile--neutral' },
  WINNER_CONFIRMED: { icon: 'trophy-outline', tileClass: 'bh-tile--gold' },
  GROUP_CREATED: { icon: 'add-circle-outline', tileClass: 'bh-tile--gold' },
};

const visual = computed(() => VISUALS[props.item.type]);
const time = computed(() => formatTime(props.item.createdAt));
</script>

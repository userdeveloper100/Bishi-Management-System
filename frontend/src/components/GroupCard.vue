<template>
  <article
    class="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
    :aria-label="group.name"
  >
    <div class="flex items-start gap-4">
      <div
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-champagne-light/40 text-[16px] font-semibold text-champagne-dark"
        aria-hidden="true"
      >
        {{ initials }}
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-[17px] font-semibold text-midnight">{{ group.name }}</h3>
        <p class="text-[13px] text-slate-500">
          {{ $t('card.members', { count: group.memberCount, months: group.cycleMonths }) }}
        </p>
      </div>
      <button type="button" class="px-1 text-slate-400" :aria-label="$t('card.moreOptions', { name: group.name })">
        <ion-icon name="ellipsis-horizontal" class="text-[20px]" aria-hidden="true" />
      </button>
    </div>

    <div class="mt-5 flex items-end justify-between">
      <div>
        <p class="text-[13px] text-slate-500">{{ $t('card.monthly') }}</p>
        <p class="mt-1 text-[26px] font-semibold tracking-tight text-midnight" data-testid="monthly-contribution">
          {{ formatINR(group.monthlyContribution) }}
        </p>
      </div>
      <span
        class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide"
        :class="statusClasses"
        data-testid="status-badge"
      >
        <ion-icon :name="statusIcon" aria-hidden="true" />
        {{ statusLabel }}
      </span>
    </div>

    <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
      <div>
        <p class="text-[13px] text-slate-500">{{ $t('card.nextBid', { round: roundLabel }) }}</p>
        <p class="text-[14px] font-semibold text-midnight">{{ nextBidLabel }}</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-[13px] font-semibold text-midnight"
        data-testid="add-members"
        @click="emit('add-members', group.id)"
      >
        <ion-icon name="person-add-outline" aria-hidden="true" />
        {{ $t('card.addMembers') }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { GroupStatus, GroupSummary } from '@/services/api.service';
import { formatBidTime, formatINR, initialsOf } from '@/utils/format';

const props = defineProps<{
  group: GroupSummary;
  /** Injected for tests; defaults to the current time. */
  now?: Date;
}>();

const emit = defineEmits<{
  'add-members': [groupId: string];
}>();

const { t } = useI18n();

const initials = computed(() => initialsOf(props.group.name));

const STATUS: Record<GroupStatus, { icon: string; classes: string }> = {
  BIDDING: { icon: 'flash-outline', classes: 'bg-champagne-light/35 text-champagne-dark' },
  OPEN: { icon: 'people-outline', classes: 'bg-mint/10 text-mint' },
  CLOSED: { icon: 'lock-closed-outline', classes: 'bg-slate-100 text-slate-500' },
};

const statusLabel = computed(() => t(`status.${props.group.status}`));
const statusIcon = computed(() => STATUS[props.group.status].icon);
const statusClasses = computed(() => STATUS[props.group.status].classes);

const roundLabel = computed(() => (props.group.nextBid ? String(props.group.nextBid.round).padStart(2, '0') : '—'));

const nextBidLabel = computed(() =>
  props.group.nextBid
    ? formatBidTime(props.group.nextBid.at, props.now, { today: t('bid.today'), tomorrow: t('bid.tomorrow') })
    : t('card.notScheduled'),
);
</script>

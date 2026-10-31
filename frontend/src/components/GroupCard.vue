<template>
  <article class="rounded-3xl border border-slate-100 bg-white p-5 shadow-card" :aria-label="group.name">
    <div class="d-flex items-start gap-4">
      <div
        class="d-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-champagne-light-40 fs-16 fw-semibold text-champagne-dark"
        aria-hidden="true"
      >
        {{ initials }}
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="truncate fs-17 fw-semibold text-midnight">{{ group.name }}</h3>
        <p class="fs-13 text-slate-500">
          {{ $t('card.members', { count: group.memberCount, months: group.cycleMonths }) }}
        </p>
      </div>
      <button type="button" class="px-1 text-slate-400" :aria-label="$t('card.moreOptions', { name: group.name })">
        <ion-icon name="ellipsis-horizontal" class="fs-20" aria-hidden="true" />
      </button>
    </div>

    <div class="mt-5 d-flex items-end justify-between">
      <div>
        <p class="fs-13 text-slate-500">{{ $t('card.monthly') }}</p>
        <p class="mt-1 fs-26 fw-semibold tracking-tight text-midnight" data-testid="monthly-contribution">
          {{ formatINR(group.monthlyContribution) }}
        </p>
      </div>
      <span class="bh-status" :class="statusClasses" data-testid="status-badge">
        <ion-icon :name="statusIcon" aria-hidden="true" />
        {{ statusLabel }}
      </span>
    </div>

    <div class="mt-5 d-flex items-center justify-between border-t border-slate-100 pt-4">
      <div>
        <p class="fs-13 text-slate-500">{{ $t('card.nextBid', { round: roundLabel }) }}</p>
        <p class="fs-14 fw-semibold text-midnight">{{ nextBidLabel }}</p>
      </div>
      <div class="d-flex gap-2">
        <router-link
          v-if="group.role === 'owner'"
          :to="`/admin/groups/${group.id}/dues`"
          class="d-inline-flex items-center gap-1-5 rounded-full border border-champagne-50 bg-champagne-light-35 px-3-5 py-2 fs-13 fw-semibold text-champagne-dark"
          data-testid="open-dues"
        >
          <ion-icon name="cash-outline" aria-hidden="true" />
          {{ $t('dues.open') }}
        </router-link>
        <button
          type="button"
          class="d-inline-flex items-center gap-1-5 rounded-full border border-slate-200 px-3-5 py-2 fs-13 fw-semibold text-midnight"
          data-testid="add-members"
          @click="emit('add-members', group.id)"
        >
          <ion-icon name="person-add-outline" aria-hidden="true" />
          {{ $t('card.addMembers') }}
        </button>
      </div>
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

// Icon and colour modifier for each status badge (see .bh-status in components).
const STATUS: Record<GroupStatus, { icon: string; classes: string }> = {
  BIDDING: { icon: 'flash-outline', classes: 'bh-status--bidding' },
  OPEN: { icon: 'people-outline', classes: 'bh-status--open' },
  CLOSED: { icon: 'lock-closed-outline', classes: 'bh-status--closed' },
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

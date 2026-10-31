<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto max-w-400 px-5 pb-40 pt-safe">
        <header class="d-flex items-center justify-between">
          <router-link
            to="/tabs/groups"
            class="d-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-midnight"
            :aria-label="$t('common.back')"
          >
            <ion-icon name="arrow-back-outline" class="fs-20" />
          </router-link>
          <span class="fs-12 uppercase tracking-20 text-slate-500">{{ group?.name }}</span>
        </header>

        <h1 class="mt-8 fs-30 fw-semibold tracking-tight text-midnight">{{ $t('dues.title') }}</h1>
        <p class="mt-1 fs-14 text-slate-500">{{ $t('dues.subtitle') }}</p>

        <div class="mt-6 d-flex items-center justify-between gap-3">
          <p class="fs-14 text-slate-600" data-testid="pending-total">
            {{ $t('dues.pendingTotal', { amount: formatINR(pendingTotal) }) }}
          </p>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-3-5 py-2 fs-13 fw-semibold text-midnight"
            :disabled="!canGenerate || busy"
            @click="onGenerate"
          >
            {{ $t('dues.generate', { period }) }}
          </button>
        </div>

        <p v-if="notice" role="status" class="mt-3 fs-14 text-mint">{{ notice }}</p>
        <p v-if="error" role="alert" class="mt-3 fs-14 text-red-600">{{ error }}</p>

        <p v-if="loading" class="mt-10 text-center fs-14 text-slate-500">{{ $t('common.loading') }}</p>

        <template v-else>
          <section class="mt-6">
            <h2 class="mb-2 fs-12 fw-semibold uppercase tracking-12 text-slate-400">
              {{ $t('dues.pending') }} · {{ pending.length }}
            </h2>
            <p
              v-if="pending.length === 0"
              class="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center fs-14 text-slate-500"
            >
              {{ $t('dues.empty') }}
            </p>
            <ul v-else class="divide-y rounded-3xl border border-slate-100 bg-white shadow-card">
              <li v-for="due in pending" :key="due.id" class="d-flex items-center gap-3 px-5 py-4">
                <div class="min-w-0 flex-1">
                  <p class="truncate fs-15 fw-semibold text-midnight">{{ due.user.name }}</p>
                  <p class="fs-13 text-slate-500">{{ maskPhone(due.user.phone ?? '') }} · {{ due.period }}</p>
                </div>
                <p class="fs-15 fw-semibold text-midnight">{{ formatINR(due.amount) }}</p>
                <button type="button" class="bh-link fs-14" @click="openConfirm(due)">
                  {{ $t('dues.markPaid') }}
                </button>
              </li>
            </ul>
          </section>

          <section class="mt-8">
            <h2 class="mb-2 fs-12 fw-semibold uppercase tracking-12 text-slate-400">
              {{ $t('dues.paid') }} · {{ paid.length }}
            </h2>
            <ul v-if="paid.length" class="divide-y rounded-3xl border border-slate-100 bg-white shadow-card">
              <li v-for="due in paid" :key="due.id" class="d-flex items-center gap-3 px-5 py-4">
                <div class="min-w-0 flex-1">
                  <p class="truncate fs-15 fw-medium text-midnight">{{ due.user.name }}</p>
                  <p class="fs-13 text-slate-500">
                    {{ $t('dues.paidOn', { date: formatDate(due.paidAt), method: methodLabel(due.method) }) }}
                  </p>
                </div>
                <p class="fs-15 fw-medium text-slate-600">{{ formatINR(due.amount) }}</p>
              </li>
            </ul>
          </section>
        </template>
      </div>

      <InfoModal
        :open="target !== null"
        :title="$t('dues.confirmTitle')"
        :subtitle="target?.user.name"
        icon="cash-outline"
        :close-label="$t('common.cancel')"
        @close="closeConfirm"
      >
        <p>{{ $t('dues.confirmBody', { name: target?.user.name ?? '', amount: formatINR(target?.amount ?? 0) }) }}</p>

        <div class="mt-4 d-flex gap-2">
          <button
            v-for="option in METHODS"
            :key="option"
            type="button"
            class="bh-pill"
            :class="{ 'bh-pill--active': method === option }"
            :aria-pressed="method === option"
            @click="method = option"
          >
            {{ methodLabel(option) }}
          </button>
        </div>

        <p v-if="actionError" role="alert" class="mt-3 fs-14 text-red-600">{{ actionError }}</p>

        <button type="button" class="bh-btn mt-6" :disabled="busy" @click="confirmPaid">
          <span>{{ $t('dues.confirm') }}</span>
          <ion-icon name="checkmark-outline" class="fs-20" aria-hidden="true" />
        </button>
      </InfoModal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import InfoModal from '@/components/InfoModal.vue';
import {
  type Due,
  type PaymentMethod,
  errorMessage,
  fetchDues,
  generateDues,
  markDuePaid,
} from '@/services/api.service';
import { useGroupsStore } from '@/stores/groups';
import { formatINR, maskPhone } from '@/utils/format';

const METHODS: PaymentMethod[] = ['CASH', 'UPI'];

const route = useRoute();
const groups = useGroupsStore();
const { t } = useI18n();

const groupId = computed(() => String(route.params.groupId ?? ''));
const group = computed(() => groups.groups.find((g) => g.id === groupId.value));
const canGenerate = computed(() => (group.value?.monthlyContribution ?? 0) > 0);

/** Current month in YYYY-MM, the period new dues are created for. */
const period = computed(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
});

const dues = ref<Due[]>([]);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const notice = ref('');

const target = ref<Due | null>(null);
const method = ref<PaymentMethod>('CASH');
const actionError = ref('');

const pending = computed(() => dues.value.filter((due) => due.status === 'PENDING'));
const paid = computed(() => dues.value.filter((due) => due.status === 'PAID'));
const pendingTotal = computed(() => pending.value.reduce((sum, due) => sum + due.amount, 0));

function methodLabel(value: PaymentMethod | null): string {
  return value === 'UPI' ? t('dues.upi') : t('dues.cash');
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    dues.value = await fetchDues(groupId.value);
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(async () => {
  if (!groups.loaded) await groups.fetch();
  await load();
});

async function onGenerate() {
  busy.value = true;
  notice.value = '';
  error.value = '';
  try {
    const amount = group.value?.monthlyContribution ?? 0;
    const result = await generateDues(groupId.value, period.value, amount);
    notice.value = t('dues.generated', { count: result.created, period: result.period });
    await load();
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}

function openConfirm(due: Due) {
  target.value = due;
  method.value = 'CASH';
  actionError.value = '';
}

function closeConfirm() {
  target.value = null;
}

async function confirmPaid() {
  if (!target.value) return;
  busy.value = true;
  actionError.value = '';
  try {
    const updated = await markDuePaid(target.value.id, method.value);
    dues.value = dues.value.map((due) => (due.id === updated.id ? { ...due, ...updated } : due));
    target.value = null;
  } catch (err) {
    actionError.value = errorMessage(err) || t('dues.error');
  } finally {
    busy.value = false;
  }
}
</script>

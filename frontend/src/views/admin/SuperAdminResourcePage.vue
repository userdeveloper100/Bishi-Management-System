<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto max-w-400 px-5 pb-40 pt-safe">
        <header class="d-flex items-center justify-between">
          <router-link
            to="/admin/super-admin"
            class="d-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-midnight"
            aria-label="Back to master settings"
          >
            <ion-icon name="arrow-back-outline" class="fs-20" />
          </router-link>
          <span class="fs-12 uppercase tracking-20 text-champagne-dark">Super Admin</span>
        </header>

        <template v-if="config">
          <h1 class="mt-8 fs-30 fw-semibold tracking-tight text-midnight">{{ config.title }}</h1>
          <p class="mt-1 fs-14 text-slate-500">{{ config.description }}</p>

          <div class="mt-6 d-flex items-center justify-between gap-3">
            <p class="fs-14 text-slate-600" data-testid="row-count">{{ rows.length }} records</p>
            <button v-if="config.canCreate" type="button" class="bh-btn" @click="openCreate">
              <span>Add</span>
              <ion-icon name="add-outline" class="fs-20" aria-hidden="true" />
            </button>
          </div>

          <p v-if="notice" role="status" class="mt-3 fs-14 text-mint">{{ notice }}</p>
          <p v-if="error" role="alert" class="mt-3 fs-14 text-red-600">{{ error }}</p>

          <p v-if="loading" class="mt-10 text-center fs-14 text-slate-500">Loading…</p>

          <ul
            v-else-if="rows.length"
            class="mt-4 divide-y rounded-3xl border border-slate-100 bg-white shadow-card"
            data-testid="rows"
          >
            <li v-for="row in rows" :key="row.id" class="d-flex items-center gap-3 px-5 py-4">
              <div class="min-w-0 flex-1">
                <p class="truncate fs-15 fw-semibold text-midnight">{{ primaryText(row) }}</p>
                <p class="truncate fs-13 text-slate-500">{{ secondaryText(row) }}</p>
              </div>
              <button v-if="config.canEdit" type="button" class="bh-link fs-14" @click="openEdit(row)">Edit</button>
              <button
                v-if="config.canDelete"
                type="button"
                class="fs-14 fw-semibold text-red-600"
                @click="confirmRemove(row)"
              >
                Delete
              </button>
            </li>
          </ul>

          <p
            v-else
            class="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-6 text-center fs-14 text-slate-500"
          >
            No records yet.
          </p>
        </template>

        <template v-else>
          <h1 class="mt-8 fs-30 fw-semibold tracking-tight text-midnight">Not found</h1>
          <p class="mt-1 fs-14 text-slate-500">That master screen does not exist.</p>
        </template>
      </div>

      <!-- Create and edit -->
      <InfoModal
        :open="form.open"
        :title="form.mode === 'create' ? `Add ${config?.title ?? ''}` : `Edit ${config?.title ?? ''}`"
        icon="create-outline"
        close-label="Cancel"
        @close="closeForm"
      >
        <form class="d-flex flex-col gap-3" @submit.prevent="submitForm">
          <label v-for="field in visibleFields" :key="field.key" class="d-flex flex-col gap-1 fs-13 text-slate-600">
            <span>{{ field.label }}</span>
            <select
              v-if="field.type === 'select'"
              v-model="form.values[field.key]"
              class="bh-field"
              :aria-label="field.label"
            >
              <option value="">Choose…</option>
              <option v-for="option in optionsFor(field)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <input
              v-else
              v-model="form.values[field.key]"
              class="bh-field"
              :type="field.type"
              :autocomplete="field.type === 'password' ? 'new-password' : 'off'"
            />
          </label>

          <p v-if="form.error" role="alert" class="fs-14 text-red-600">{{ form.error }}</p>

          <button type="submit" class="bh-btn mt-2" :disabled="busy">
            <span>Save</span>
            <ion-icon name="checkmark-outline" class="fs-20" aria-hidden="true" />
          </button>
        </form>
      </InfoModal>

      <!-- Delete confirmation -->
      <InfoModal
        :open="target !== null"
        title="Delete this record?"
        :subtitle="target && config ? config.rowLabel(target) : ''"
        icon="trash-outline"
        close-label="Cancel"
        @close="target = null"
      >
        <p>This cannot be undone.</p>
        <p v-if="actionError" role="alert" class="mt-3 fs-14 text-red-600">{{ actionError }}</p>
        <button type="button" class="mt-6 w-full rounded-2xl bg-red-600 py-4 fs-15 fw-semibold text-white" :disabled="busy" @click="removeTarget">
          Delete
        </button>
      </InfoModal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, onIonViewWillEnter } from '@ionic/vue';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import InfoModal from '@/components/InfoModal.vue';
import {
  type SuperAdminResource,
  type SuperAdminRow,
  createSuperAdmin,
  deleteSuperAdmin,
  errorMessage,
  listSuperAdmin,
  updateSuperAdmin,
} from '@/services/api.service';
import {
  type SuperAdminField,
  buildPayload,
  isSuperAdminResource,
  optionText,
  SUPER_ADMIN_RESOURCES,
} from '@/utils/superAdminResources';

const route = useRoute();

const resource = computed<SuperAdminResource | null>(() =>
  isSuperAdminResource(route.params.resource) ? route.params.resource : null,
);
const config = computed(() => (resource.value ? SUPER_ADMIN_RESOURCES[resource.value] : null));
const visibleFields = computed(() =>
  (config.value?.fields ?? []).filter((field) => !(form.mode === 'edit' && field.createOnly)),
);

const rows = ref<SuperAdminRow[]>([]);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const notice = ref('');

/** Choices for each select field, loaded from the resource it refers to. */
const optionsByField = ref<Record<string, Array<{ value: string; label: string }>>>({});

const form = reactive<{
  open: boolean;
  mode: 'create' | 'edit';
  row: SuperAdminRow | null;
  values: Record<string, string>;
  error: string;
}>({ open: false, mode: 'create', row: null, values: {}, error: '' });

const target = ref<SuperAdminRow | null>(null);
const actionError = ref('');

function primaryText(row: SuperAdminRow): string {
  const first = config.value?.columns[0];
  return first ? first.value(row) : String(row.id);
}

function secondaryText(row: SuperAdminRow): string {
  return (config.value?.columns ?? [])
    .slice(1)
    .map((column) => column.value(row))
    .filter(Boolean)
    .join(' · ');
}

function optionsFor(field: SuperAdminField) {
  return optionsByField.value[field.key] ?? field.options ?? [];
}

async function loadOptions() {
  const fields = (config.value?.fields ?? []).filter((field) => field.optionsFrom);
  const next: Record<string, Array<{ value: string; label: string }>> = {};
  await Promise.all(
    fields.map(async (field) => {
      const source = await listSuperAdmin(field.optionsFrom as SuperAdminResource);
      next[field.key] = source.map((row) => ({ value: String(row.id), label: optionText(field, row) }));
    }),
  );
  optionsByField.value = next;
}

async function load() {
  if (!resource.value) return;
  loading.value = true;
  error.value = '';
  try {
    rows.value = await listSuperAdmin(resource.value);
    await loadOptions();
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.mode = 'create';
  form.row = null;
  form.values = Object.fromEntries((config.value?.fields ?? []).map((field) => [field.key, '']));
  form.error = '';
  form.open = true;
}

function openEdit(row: SuperAdminRow) {
  form.mode = 'edit';
  form.row = row;
  // Passwords are never shown. A blank password keeps the current one.
  form.values = Object.fromEntries(
    (config.value?.fields ?? []).map((field) => [
      field.key,
      field.type === 'password' ? '' : String(row[field.key] ?? ''),
    ]),
  );
  form.error = '';
  form.open = true;
}

function closeForm() {
  form.open = false;
}

async function submitForm() {
  if (!resource.value || !config.value) return;
  let body: Record<string, unknown>;
  try {
    body = buildPayload(config.value.fields, form.values, form.mode);
  } catch (err) {
    form.error = (err as Error).message;
    return;
  }

  busy.value = true;
  form.error = '';
  try {
    if (form.mode === 'create') {
      await createSuperAdmin(resource.value, body);
      notice.value = `${config.value.title}: record added.`;
    } else if (form.row) {
      await updateSuperAdmin(resource.value, String(form.row.id), body);
      notice.value = `${config.value.title}: changes saved.`;
    }
    form.open = false;
    await load();
  } catch (err) {
    form.error = errorMessage(err);
  } finally {
    busy.value = false;
  }
}

function confirmRemove(row: SuperAdminRow) {
  actionError.value = '';
  target.value = row;
}

async function removeTarget() {
  if (!resource.value || !target.value) return;
  busy.value = true;
  actionError.value = '';
  try {
    await deleteSuperAdmin(resource.value, String(target.value.id));
    target.value = null;
    notice.value = 'Record deleted.';
    await load();
  } catch (err) {
    actionError.value = errorMessage(err);
  } finally {
    busy.value = false;
  }
}

onIonViewWillEnter(load);
watch(resource, load);
</script>

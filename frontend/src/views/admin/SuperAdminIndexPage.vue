<template>
  <ion-page>
    <ion-content :fullscreen="true" class="bg-pearl">
      <div class="mx-auto max-w-400 px-5 pb-40 pt-safe">
        <header class="d-flex items-center justify-between">
          <router-link
            to="/tabs/profile"
            class="d-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-midnight"
            aria-label="Back to profile"
          >
            <ion-icon name="arrow-back-outline" class="fs-20" />
          </router-link>
          <span class="fs-12 uppercase tracking-20 text-champagne-dark">Super Admin</span>
        </header>

        <h1 class="mt-8 fs-30 fw-semibold tracking-tight text-midnight">Master settings</h1>
        <p class="mt-1 fs-14 text-slate-500">Platform-wide data. Only Super Admins can open these screens.</p>

        <ul class="mt-6 divide-y rounded-3xl border border-slate-100 bg-white shadow-card">
          <li v-for="resource in ORDER" :key="resource">
            <router-link :to="`/admin/super-admin/${resource}`" class="d-flex items-center gap-3 px-5 py-4">
              <div class="min-w-0 flex-1">
                <p class="fs-15 fw-semibold text-midnight">{{ RESOURCES[resource].title }}</p>
                <p class="fs-13 text-slate-500">{{ RESOURCES[resource].description }}</p>
              </div>
              <ion-icon name="chevron-forward-outline" class="fs-18 text-slate-400" aria-hidden="true" />
            </router-link>
          </li>
        </ul>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue';

import { SUPER_ADMIN_ORDER, SUPER_ADMIN_RESOURCES } from '@/utils/superAdminResources';

const ORDER = SUPER_ADMIN_ORDER;
const RESOURCES = SUPER_ADMIN_RESOURCES;
</script>

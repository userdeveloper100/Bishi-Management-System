import { config } from '@vue/test-utils';
import { vi } from 'vitest';
import { useRouter } from 'vue-router';

import { i18n } from '@/i18n';

// Every mounted component can use $t and useI18n. Tests that need another language set it explicitly.
config.global.plugins = [i18n];

// Ionic's navigation needs the Ionic app context, which jsdom does not provide. Route it through vue-router instead,
// so tests can check where a page navigated.
vi.mock('@ionic/vue', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, useIonRouter: ionRouterOverVueRouter };
});

export function ionRouterOverVueRouter() {
  const router = useRouter();
  return {
    navigate: (location: string, _direction?: string, action?: string) =>
      action === 'replace' ? router.replace(location) : router.push(location),
    back: () => router.back(),
  };
}

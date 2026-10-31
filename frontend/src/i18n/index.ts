import { createI18n } from 'vue-i18n';

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import mr from '@/locales/mr.json';

export const APP_LOCALES = ['en', 'hi', 'mr'] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

const LOCALE_STORAGE_KEY = 'bhishipay.locale';

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value);
}

/** The language last chosen on this device, so the first screen is already translated. */
function storedLocale(): AppLocale {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isAppLocale(value)) return value;
  } catch {
    // Storage can be blocked (for example in private mode). Fall back to English.
  }
  return 'en';
}

export const i18n = createI18n({
  legacy: false,
  locale: storedLocale(),
  fallbackLocale: 'en',
  messages: { en, hi, mr },
});

document.documentElement.lang = i18n.global.locale.value;

/** Switch the UI language immediately and remember the choice on this device. */
export function setAppLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  document.documentElement.lang = locale;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Not saved on this device. The copy on the server still holds the choice.
  }
}

export function currentAppLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale;
}

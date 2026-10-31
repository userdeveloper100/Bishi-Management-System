import { createI18n } from 'vue-i18n';

import bn from '@/locales/bn.json';
import en from '@/locales/en.json';
import gu from '@/locales/gu.json';
import hi from '@/locales/hi.json';
import kn from '@/locales/kn.json';
import mr from '@/locales/mr.json';
import mwr from '@/locales/mwr.json';
import pa from '@/locales/pa.json';
import ta from '@/locales/ta.json';
import te from '@/locales/te.json';

/** Every language the app can show. Keep in step with the backend SUPPORTED_LANGUAGES list. */
export const APP_LOCALES = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'bn', 'pa', 'gu', 'mwr'] as const;
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
  messages: { en, hi, mr, ta, te, kn, bn, pa, gu, mwr },
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

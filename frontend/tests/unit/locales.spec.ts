import { describe, expect, test } from 'vitest';

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

type Messages = Record<string, unknown>;

const TRANSLATIONS: Record<string, Messages> = { hi, mr, ta, te, kn, bn, pa, gu, mwr };

/** Dotted paths to every leaf message, for example "otp.resendIn". */
function keysOf(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null ? keysOf(value as Messages, path) : [path];
  });
}

function valueAt(messages: Messages, path: string): string {
  return path.split('.').reduce<unknown>((node, part) => (node as Messages)[part], messages) as string;
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('locale files', () => {
  const english = keysOf(en).sort();

  test('English has all of the expected top-level sections', () => {
    expect(Object.keys(en)).toEqual(expect.arrayContaining(['login', 'otp', 'groups', 'alerts', 'profile']));
  });

  test.each(Object.keys(TRANSLATIONS))('%s has every English key and no extra keys', (code) => {
    expect(keysOf(TRANSLATIONS[code]).sort()).toEqual(english);
  });

  test.each(Object.keys(TRANSLATIONS))('%s keeps the placeholders of the English text', (code) => {
    for (const path of english) {
      expect(placeholders(valueAt(TRANSLATIONS[code], path)), `${code}: ${path}`).toEqual(
        placeholders(valueAt(en, path)),
      );
    }
  });

  test.each(Object.keys(TRANSLATIONS))('%s has no empty messages', (code) => {
    for (const path of english) {
      expect(valueAt(TRANSLATIONS[code], path).trim(), `${code}: ${path}`).not.toBe('');
    }
  });
});

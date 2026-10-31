import { describe, expect, test } from 'vitest';

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import mr from '@/locales/mr.json';

type Messages = Record<string, unknown>;

/** Dotted paths to every leaf message, for example "otp.resendIn". */
function keysOf(messages: Messages, prefix = ''): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null ? keysOf(value as Messages, path) : [path];
  });
}

describe('locale files', () => {
  const english = keysOf(en).sort();

  test.each([
    ['hi', hi],
    ['mr', mr],
  ])('%s has every English key and no extra keys', (_name, messages) => {
    expect(keysOf(messages).sort()).toEqual(english);
  });

  test('placeholders in each translation match the English text', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    const pairs = keysOf(en).map((path) => {
      const at = (messages: Messages) =>
        path.split('.').reduce<unknown>((node, part) => (node as Messages)[part], messages);
      return { path, source: at(en) as string, hi: at(hi) as string, mr: at(mr) as string };
    });

    for (const pair of pairs) {
      expect(placeholders(pair.hi), pair.path).toEqual(placeholders(pair.source));
      expect(placeholders(pair.mr), pair.path).toEqual(placeholders(pair.source));
    }
  });
});

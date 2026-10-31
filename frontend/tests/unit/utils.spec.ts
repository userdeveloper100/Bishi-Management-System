import { describe, expect, test } from 'vitest';

import type { AlertItem } from '@/services/api.service';
import { formatBidTime, formatINR, formatTime, groupAlertsByDay, initialsOf, maskPhone, toE164 } from '@/utils/format';

describe('toE164', () => {
  test('accepts a 10-digit Indian mobile number', () => {
    expect(toE164('9876543210')).toBe('+919876543210');
  });

  test('accepts the number with spaces, a +91 prefix or a 91 prefix', () => {
    expect(toE164('+91 98765 43210')).toBe('+919876543210');
    expect(toE164('919876543210')).toBe('+919876543210');
  });

  test('rejects numbers that are too short, too long, or start with 0', () => {
    expect(toE164('12345')).toBeNull();
    expect(toE164('0123456789')).toBeNull();
    expect(toE164('98765432101')).toBeNull();
    expect(toE164('')).toBeNull();
  });
});

describe('display helpers', () => {
  test('maskPhone keeps only the last four digits', () => {
    expect(maskPhone('+919876544821')).toBe('+91 •••••• 4821');
  });

  test('initialsOf uses one or two letters from the name', () => {
    expect(initialsOf('Sp')).toBe('SP');
    expect(initialsOf('Priya Sharma')).toBe('PS');
    expect(initialsOf('  ')).toBe('?');
  });

  test('formatINR uses Indian digit grouping and the rupee sign', () => {
    expect(formatINR(96000)).toBe('₹96,000');
    expect(formatINR(1234567)).toBe('₹12,34,567');
  });

  test('formatTime prints 12-hour time with AM/PM', () => {
    expect(formatTime(new Date(2026, 9, 31, 19, 0).toISOString())).toBe('7:00 PM');
  });
});

describe('formatBidTime', () => {
  const now = new Date(2026, 9, 31, 9, 0);

  test('says Today for a bid on the same day', () => {
    expect(formatBidTime(new Date(2026, 9, 31, 19, 0).toISOString(), now)).toBe('Today, 7:00 PM');
  });

  test('says Tomorrow for the next day', () => {
    expect(formatBidTime(new Date(2026, 10, 1, 19, 0).toISOString(), now)).toBe('Tomorrow, 7:00 PM');
  });

  test('uses the date for later bids', () => {
    expect(formatBidTime(new Date(2026, 10, 12, 19, 0).toISOString(), now)).toContain('Nov');
  });
});

describe('groupAlertsByDay', () => {
  const now = new Date(2026, 9, 31, 12, 0);
  const at = (day: number, hour: number): string => new Date(2026, 9, day, hour, 0).toISOString();

  const item = (id: string, createdAt: string): AlertItem => ({
    id,
    type: 'ROUND_OPEN',
    title: id,
    body: '',
    groupName: 'Test Bhishi',
    read: false,
    createdAt,
  });

  test('groups today, yesterday and older alerts under their day labels, keeping order', () => {
    const groups = groupAlertsByDay(
      [item('a', at(31, 19)), item('b', at(31, 9)), item('c', at(30, 16)), item('d', at(28, 10))],
      now,
    );

    expect(groups.map((g) => g.label)).toEqual(['TODAY', 'YESTERDAY', expect.stringContaining('OCT')]);
    expect(groups[0].items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(groups[1].items.map((i) => i.id)).toEqual(['c']);
    expect(groups[2].items.map((i) => i.id)).toEqual(['d']);
  });

  test('returns no groups for an empty feed', () => {
    expect(groupAlertsByDay([], now)).toEqual([]);
  });
});

describe('toE164 with seeded accounts', () => {
  test('accepts the seeded numbers so the development sign-in can submit them', () => {
    expect(toE164('1234567890')).toBe('+911234567890');
    expect(toE164('+91 1234567891')).toBe('+911234567891');
    expect(toE164('1234567892')).toBe('+911234567892');
  });
});

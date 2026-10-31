import type { AlertItem } from '@/services/api.service';

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/**
 * Local test numbers for development sign-in (the seeded admin and member accounts).
 * They are not real mobile numbers. The backend accepts them only while local test mode is on,
 * so it is safe to allow them here.
 */
export const DUMMY_LOGIN_PHONES: readonly string[] = ['+911234567890', '+911234567891'];

/**
 * Normalises an Indian mobile number to E.164 (+91XXXXXXXXXX).
 * Accepts 10 digits, or the same with a +91 or 91 prefix. Returns null if invalid.
 */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const national = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  const e164 = `+91${national}`;
  if (DUMMY_LOGIN_PHONES.includes(e164)) return e164;
  return INDIAN_MOBILE.test(national) ? e164 : null;
}

/** "+919876544821" -> "+91 •••••• 4821" */
export function maskPhone(e164: string): string {
  const last4 = e164.replace(/\D/g, '').slice(-4);
  return `+91 •••••• ${last4}`;
}

/** "Sp" -> "SP", "Priya Sharma" -> "PS" */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

/** 9000 -> "₹9,000" (Indian digit grouping). */
export function formatINR(amount: number): string {
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`;
}

/** "2026-10-31T19:00:00.000Z" -> "7:00 PM" in the device's time zone. */
export function formatTime(iso: string): string {
  // en-US keeps the uppercase "PM" used in the design.
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whole calendar days between the two dates (0 = same day). */
function dayDifference(from: Date, to: Date): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}

export interface BidDayLabels {
  today: string;
  tomorrow: string;
}

const BID_DAY_LABELS: BidDayLabels = { today: 'Today', tomorrow: 'Tomorrow' };

/** "Today, 7:00 PM" / "Tomorrow, 7:00 PM" / "12 Nov, 7:00 PM" for a bid time. */
export function formatBidTime(iso: string, now: Date = new Date(), labels: BidDayLabels = BID_DAY_LABELS): string {
  const at = new Date(iso);
  const diff = dayDifference(now, at);
  const day =
    diff === 0
      ? labels.today
      : diff === 1
        ? labels.tomorrow
        : at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${day}, ${formatTime(iso)}`;
}

export interface AlertDayGroup {
  label: string;
  items: AlertItem[];
}

/**
 * Groups alerts (already newest first) under TODAY, YESTERDAY, or a date label.
 * Order of groups and items is preserved.
 */
export function groupAlertsByDay(
  items: AlertItem[],
  now: Date = new Date(),
  labels: { today: string; yesterday: string } = { today: 'TODAY', yesterday: 'YESTERDAY' },
): AlertDayGroup[] {
  const groups: AlertDayGroup[] = [];
  for (const item of items) {
    const diff = dayDifference(new Date(item.createdAt), now);
    const label =
      diff === 0
        ? labels.today
        : diff === 1
          ? labels.yesterday
          : new Date(item.createdAt)
              .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              .toUpperCase();
    const current = groups[groups.length - 1];
    if (current && current.label === label) {
      current.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }
  return groups;
}

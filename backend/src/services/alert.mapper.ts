// src/services/alert.mapper.ts
// Pure functions that turn notifications into the activity-feed shape the frontend expects.
import { badRequest } from "../utils/httpError";

export const ALERT_TYPES = [
  "ROUND_OPEN",
  "MEMBER_JOINED",
  "WINNER_CONFIRMED",
  "GROUP_CREATED",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_CATEGORIES = [
  "all",
  "winners",
  "members",
  "rounds",
] as const;
export type AlertCategory = (typeof ALERT_CATEGORIES)[number];

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  all: "All",
  winners: "Winners",
  members: "Members",
  rounds: "Rounds",
};

const CATEGORY_TYPES: Record<AlertCategory, readonly AlertType[]> = {
  all: ALERT_TYPES,
  winners: ["WINNER_CONFIRMED"],
  members: ["MEMBER_JOINED"],
  rounds: ["ROUND_OPEN"],
};

export interface NotificationRow {
  id: string;
  message: string;
  title: string | null;
  type: string | null;
  groupName: string | null;
  read: boolean;
  created_date: Date;
}

export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  groupName: string | null;
  read: boolean;
  createdAt: string;
}

/** Read the ?category= query value. Missing means "all"; anything unknown is a 400. */
export function parseCategory(value: unknown): AlertCategory {
  if (value === undefined) return "all";
  if (
    typeof value === "string" &&
    (ALERT_CATEGORIES as readonly string[]).includes(value)
  ) {
    return value as AlertCategory;
  }
  throw badRequest(`category must be one of ${ALERT_CATEGORIES.join(", ")}`);
}

export function isAlertType(value: string | null): value is AlertType {
  return value !== null && (ALERT_TYPES as readonly string[]).includes(value);
}

/** Notifications without a known alert type are general messages and are left out of the feed. */
export function toAlertItem(row: NotificationRow): AlertItem | null {
  if (!isAlertType(row.type)) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title ?? row.message,
    body: row.message,
    groupName: row.groupName,
    read: row.read,
    createdAt: row.created_date.toISOString(),
  };
}

export function filterByCategory(
  items: AlertItem[],
  category: AlertCategory,
): AlertItem[] {
  const types = CATEGORY_TYPES[category];
  return items.filter((item) => types.includes(item.type));
}

export function buildCategories(items: AlertItem[]) {
  return ALERT_CATEGORIES.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    count: filterByCategory(items, key).length,
  }));
}

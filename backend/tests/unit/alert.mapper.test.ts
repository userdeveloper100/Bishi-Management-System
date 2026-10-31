import {
  AlertItem,
  buildCategories,
  filterByCategory,
  NotificationRow,
  parseCategory,
  toAlertItem,
} from "../../src/services/alert.mapper";
import { statusOf } from "../helpers/statusOf";

function row(overrides: Partial<NotificationRow> = {}): NotificationRow {
  return {
    id: "n1",
    message: "Test Bhishi · Place your bid before 7 PM",
    title: "Round 04 is open for bidding",
    type: "ROUND_OPEN",
    groupName: "Test Bhishi",
    read: false,
    created_date: new Date("2026-10-31T13:30:00.000Z"),
    ...overrides,
  };
}

const items: AlertItem[] = [
  toAlertItem(row({ id: "a", type: "ROUND_OPEN" }))!,
  toAlertItem(row({ id: "b", type: "MEMBER_JOINED" }))!,
  toAlertItem(row({ id: "c", type: "WINNER_CONFIRMED" }))!,
  toAlertItem(row({ id: "d", type: "WINNER_CONFIRMED" }))!,
  toAlertItem(row({ id: "e", type: "GROUP_CREATED" }))!,
];

describe("parseCategory", () => {
  it("defaults to all when missing", () => {
    expect(parseCategory(undefined)).toBe("all");
  });

  it.each(["all", "winners", "members", "rounds"])("accepts %s", (value) => {
    expect(parseCategory(value)).toBe(value);
  });

  it.each(["Winners", "unknown", "", ["all"]])(
    "rejects %p with a 400",
    (value) => {
      expect(statusOf(() => parseCategory(value))).toBe(400);
    },
  );
});

describe("toAlertItem", () => {
  it("maps a typed notification to the feed shape", () => {
    expect(toAlertItem(row())).toEqual({
      id: "n1",
      type: "ROUND_OPEN",
      title: "Round 04 is open for bidding",
      body: "Test Bhishi · Place your bid before 7 PM",
      groupName: "Test Bhishi",
      read: false,
      createdAt: "2026-10-31T13:30:00.000Z",
    });
  });

  it("uses the message as the title when no title is stored", () => {
    expect(toAlertItem(row({ title: null }))).toMatchObject({
      title: "Test Bhishi · Place your bid before 7 PM",
    });
  });

  it("drops notifications without a known alert type", () => {
    expect(toAlertItem(row({ type: null }))).toBeNull();
    expect(toAlertItem(row({ type: "SOMETHING_ELSE" }))).toBeNull();
  });
});

describe("filterByCategory", () => {
  it("returns everything for all", () => {
    expect(filterByCategory(items, "all")).toHaveLength(5);
  });

  it("maps winners, members and rounds to their alert types", () => {
    expect(filterByCategory(items, "winners").map((i) => i.id)).toEqual([
      "c",
      "d",
    ]);
    expect(filterByCategory(items, "members").map((i) => i.id)).toEqual(["b"]);
    expect(filterByCategory(items, "rounds").map((i) => i.id)).toEqual(["a"]);
  });
});

describe("buildCategories", () => {
  it("lists every category in order with labels and counts", () => {
    expect(buildCategories(items)).toEqual([
      { key: "all", label: "All", count: 5 },
      { key: "winners", label: "Winners", count: 2 },
      { key: "members", label: "Members", count: 1 },
      { key: "rounds", label: "Rounds", count: 1 },
    ]);
  });

  it("returns zero counts for an empty feed", () => {
    expect(buildCategories([]).map((c) => c.count)).toEqual([0, 0, 0, 0]);
  });
});

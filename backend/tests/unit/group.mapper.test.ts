import {
  countMembers,
  GroupRow,
  parseGroupStatus,
  summariseContributions,
  toGroupRole,
  toGroupStatus,
  toGroupSummary,
  toNextBid,
} from "../../src/services/group.mapper";
import { statusOf } from "../helpers/statusOf";

function group(overrides: Partial<GroupRow> = {}): GroupRow {
  return {
    id: "g1",
    name: "Test Bhishi",
    cycleMonths: 10,
    monthlyContribution: 32000,
    status: "BIDDING",
    nextBidRound: 4,
    nextBidAt: new Date("2026-11-01T13:30:00.000Z"),
    membership: [],
    bishis: [],
    ...overrides,
  };
}

describe("parseGroupStatus", () => {
  it.each(["BIDDING", "OPEN", "CLOSED"])("accepts %s", (value) => {
    expect(parseGroupStatus(value)).toBe(value);
  });

  it.each(["bidding", "PAUSED", "", 1, null])(
    "rejects %p with a 400",
    (value) => {
      expect(statusOf(() => parseGroupStatus(value))).toBe(400);
    },
  );
});

describe("toGroupStatus", () => {
  it("falls back to OPEN for unknown stored values", () => {
    expect(toGroupStatus("CLOSED")).toBe("CLOSED");
    expect(toGroupStatus("legacy")).toBe("OPEN");
  });
});

describe("countMembers", () => {
  it("counts only accepted memberships", () => {
    const count = countMembers([
      { userId: "a", role: "member", status: "accepted" },
      { userId: "b", role: "member", status: "pending" },
      { userId: "c", role: null, status: "accepted" },
      { userId: "d", role: null, status: null },
    ]);
    expect(count).toBe(2);
  });
});

describe("toGroupRole", () => {
  it("is owner when the user holds an owner membership", () => {
    const g = group({
      membership: [{ userId: "u1", role: "owner", status: "accepted" }],
    });
    expect(toGroupRole(g, "u1")).toBe("owner");
  });

  it("is owner when the user owns a bishi in the group", () => {
    const g = group({ bishis: [{ ownerId: "u1" }] });
    expect(toGroupRole(g, "u1")).toBe("owner");
  });

  it("is member otherwise, including for another user's owner membership", () => {
    const g = group({
      membership: [
        { userId: "u1", role: "member", status: "accepted" },
        { userId: "u2", role: "owner", status: "accepted" },
      ],
    });
    expect(toGroupRole(g, "u1")).toBe("member");
  });
});

describe("toNextBid", () => {
  it("returns round and ISO time when both are set", () => {
    expect(toNextBid(group())).toEqual({
      round: 4,
      at: "2026-11-01T13:30:00.000Z",
    });
  });

  it("returns null when either field is missing", () => {
    expect(toNextBid({ nextBidRound: null, nextBidAt: new Date() })).toBeNull();
    expect(toNextBid({ nextBidRound: 2, nextBidAt: null })).toBeNull();
  });
});

describe("toGroupSummary", () => {
  it("maps a row to the frontend shape", () => {
    const g = group({
      membership: [
        { userId: "u1", role: "member", status: "accepted" },
        { userId: "u2", role: "member", status: "accepted" },
      ],
    });
    expect(toGroupSummary(g, "u1")).toEqual({
      id: "g1",
      name: "Test Bhishi",
      memberCount: 2,
      cycleMonths: 10,
      monthlyContribution: 32000,
      status: "BIDDING",
      nextBid: { round: 4, at: "2026-11-01T13:30:00.000Z" },
      role: "member",
    });
  });
});

describe("summariseContributions", () => {
  it("sums amounts and counts contributions", () => {
    expect(summariseContributions(96000, 3)).toEqual({
      totalSavings: 96000,
      contributionsCount: 3,
    });
  });

  it("returns zero when the user has no contributions", () => {
    expect(summariseContributions(null, 0)).toEqual({
      totalSavings: 0,
      contributionsCount: 0,
    });
  });
});

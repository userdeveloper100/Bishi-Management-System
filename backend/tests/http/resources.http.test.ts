import jwt from "jsonwebtoken";
import request from "supertest";
import { prismaMock } from "../helpers/prismaMock";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../../src/app").default;

function tokenFor(userId: string, role = "user") {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string);
}

const userToken = tokenFor("u1");
const adminToken = tokenFor("admin-1", "admin");

describe("GET /api/groups", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/groups");

    expect(res.status).toBe(401);
    expect(prismaMock.group.findMany).not.toHaveBeenCalled();
  });

  it("returns the summary and the caller's groups", async () => {
    prismaMock.group.findMany.mockResolvedValue([
      {
        id: "g1",
        name: "Test Bhishi",
        cycleMonths: 10,
        monthlyContribution: 32000,
        status: "BIDDING",
        nextBidRound: 4,
        nextBidAt: new Date("2026-11-01T13:30:00.000Z"),
        membership: [{ userId: "u1", role: "owner", status: "accepted" }],
        bishis: [],
      },
    ]);
    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: 96000 },
      _count: { _all: 3 },
    });

    const res = await request(app)
      .get("/api/groups")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toEqual({
      totalSavings: 96000,
      contributionsCount: 3,
    });
    expect(res.body.data.groups).toEqual([
      {
        id: "g1",
        name: "Test Bhishi",
        memberCount: 1,
        cycleMonths: 10,
        monthlyContribution: 32000,
        status: "BIDDING",
        nextBid: { round: 4, at: "2026-11-01T13:30:00.000Z" },
        role: "owner",
      },
    ]);
  });

  it("scopes a regular user's query to their own groups", async () => {
    prismaMock.group.findMany.mockResolvedValue([]);
    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: null },
      _count: { _all: 0 },
    });

    await request(app)
      .get("/api/groups")
      .set("Authorization", `Bearer ${userToken}`);

    expect(prismaMock.group.findMany.mock.calls[0][0].where).toBeDefined();
  });

  it("does not scope an admin's query", async () => {
    prismaMock.group.findMany.mockResolvedValue([]);
    prismaMock.transaction.aggregate.mockResolvedValue({
      _sum: { amount: null },
      _count: { _all: 0 },
    });

    await request(app)
      .get("/api/groups")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(prismaMock.group.findMany.mock.calls[0][0].where).toBeUndefined();
  });

  it("rejects an invalid status on create with a 400", async () => {
    const res = await request(app)
      .post("/api/groups")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "New group", status: "PAUSED" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "status must be one of BIDDING, OPEN, CLOSED",
    );
  });
});

describe("GET /api/alerts", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/alerts");

    expect(res.status).toBe(401);
  });

  it("returns 400 for an unknown category", async () => {
    const res = await request(app)
      .get("/api/alerts?category=loans")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns categories with counts and the feed items", async () => {
    prismaMock.notification.findMany.mockResolvedValue([
      {
        id: "n1",
        message: "Test Bhishi · Winning bid confirmed",
        title: "Amit won Round 03",
        type: "WINNER_CONFIRMED",
        groupName: "Test Bhishi",
        read: false,
        created_date: new Date("2026-10-31T10:45:00.000Z"),
      },
      {
        id: "n2",
        message: "Your circle now has 8 members",
        title: null,
        type: "MEMBER_JOINED",
        groupName: "Test Bhishi",
        read: true,
        created_date: new Date("2026-10-31T12:12:00.000Z"),
      },
      {
        id: "n3",
        message: "General notice",
        title: null,
        type: null,
        groupName: null,
        read: false,
        created_date: new Date("2026-10-30T09:00:00.000Z"),
      },
    ]);

    const res = await request(app)
      .get("/api/alerts")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.categories).toEqual([
      { key: "all", label: "All", count: 2 },
      { key: "winners", label: "Winners", count: 1 },
      { key: "members", label: "Members", count: 1 },
      { key: "rounds", label: "Rounds", count: 0 },
    ]);
    expect(res.body.data.items.map((item: { id: string }) => item.id)).toEqual([
      "n1",
      "n2",
    ]);
    expect(res.body.data.items[1]).toEqual({
      id: "n2",
      type: "MEMBER_JOINED",
      title: "Your circle now has 8 members",
      body: "Your circle now has 8 members",
      groupName: "Test Bhishi",
      read: true,
      createdAt: "2026-10-31T12:12:00.000Z",
    });
  });

  it("queries only the caller's notifications, newest first", async () => {
    prismaMock.notification.findMany.mockResolvedValue([]);

    await request(app)
      .get("/api/alerts?category=rounds")
      .set("Authorization", `Bearer ${userToken}`);

    const args = prismaMock.notification.findMany.mock.calls[0][0];
    expect(args.where.userId).toBe("u1");
    expect(args.orderBy).toEqual({ created_date: "desc" });
  });
});

describe("GET /api/user/profile", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/user/profile");

    expect(res.status).toBe(401);
  });

  it("returns 404 when the user no longer exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "User not found" });
  });

  it("returns the profile with initials and Pro status", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      name: "Shailendra Pardeshi",
      phone: "+919876543210",
      phoneVerified: true,
      email: null,
      upiId: "sp@upi",
      language: "en",
      proUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .get("/api/user/profile")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: "u1",
      initials: "SP",
      phoneVerified: true,
      email: null,
      upiId: "sp@upi",
      language: "en",
      pro: {
        active: true,
        planName: "BhishiPay Pro",
        price: 299,
        currency: "INR",
        period: "3 months",
      },
    });
    expect(prismaMock.user.findUnique.mock.calls[0][0].where).toEqual({
      id: "u1",
    });
  });
});

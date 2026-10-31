import request from "supertest";
import { prismaMock } from "../helpers/prismaMock";
import { authService } from "../../src/services/auth.service";

jest.mock("../../src/prismaClient", () => ({ prisma: require("../helpers/prismaMock").prismaMock }));
jest.mock("../../src/services/sms.service", () => ({ getSmsSender: jest.fn() }));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../../src/app").default;

// resetMocks clears implementations before each test, so the transaction helper is restored here.
beforeEach(() => {
  prismaMock.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prismaMock));
});

const adminToken = authService.generateToken({ id: "admin-1", role: "admin" });
const memberToken = authService.generateToken({ id: "member-1", role: "user" });
const due = { id: "c1", groupId: "g1", userId: "member-1", status: "PENDING" };

describe("POST /api/contributions/:id/mark-paid", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/contributions/c1/mark-paid").send({ method: "CASH" });
    expect(res.status).toBe(401);
  });

  it("returns 403 for a member", async () => {
    prismaMock.contribution.findUnique.mockResolvedValue(due);
    prismaMock.membership.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/contributions/c1/mark-paid")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ method: "CASH" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("returns 200 for a group admin and records the payment", async () => {
    prismaMock.contribution.findUnique.mockResolvedValue(due);
    prismaMock.membership.findFirst.mockResolvedValue({ id: "m-admin" });
    prismaMock.contribution.update.mockResolvedValue({ ...due, status: "PAID", method: "CASH" });
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app)
      .post("/api/contributions/c1/mark-paid")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ method: "CASH" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: "PAID", method: "CASH" } });
    expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for an unknown method", async () => {
    const res = await request(app)
      .post("/api/contributions/c1/mark-paid")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ method: "CHEQUE" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/user/dues", () => {
  it("returns the signed-in member's own dues", async () => {
    prismaMock.contribution.findMany.mockResolvedValue([due]);

    const res = await request(app).get("/api/user/dues").set("Authorization", `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(prismaMock.contribution.findMany.mock.calls[0][0].where).toEqual({ userId: "member-1" });
  });
});

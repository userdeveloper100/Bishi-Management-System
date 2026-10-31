import { prismaMock } from "../helpers/prismaMock";
import { contributionService } from "../../src/services/contribution.service";

jest.mock("../../src/prismaClient", () => ({ prisma: require("../helpers/prismaMock").prismaMock }));

// resetMocks clears implementations before each test, so the transaction helper is restored here.
beforeEach(() => {
  prismaMock.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prismaMock));
});

const GROUP = "g1";
const ADMIN = { userId: "admin-1", role: "admin" };
const SUPER = { userId: "super-1", role: "super_admin" };
const MEMBER = { userId: "member-1", role: "user" };

describe("contributionService.generateDues", () => {
  const input = { groupId: GROUP, period: "2026-11", amount: 5000 };

  it("rejects a period that is not YYYY-MM", async () => {
    await expect(
      contributionService.generateDues(ADMIN, { ...input, period: "2026-13" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a non-positive amount", async () => {
    await expect(
      contributionService.generateDues(ADMIN, { ...input, amount: 0 }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("returns 404 for an unknown group", async () => {
    prismaMock.group.findUnique.mockResolvedValue(null);
    await expect(contributionService.generateDues(ADMIN, input)).rejects.toMatchObject({ status: 404 });
  });

  it("refuses a member who is not an admin of the group", async () => {
    prismaMock.group.findUnique.mockResolvedValue({ id: GROUP });
    prismaMock.membership.findFirst.mockResolvedValue(null);
    await expect(contributionService.generateDues(MEMBER, input)).rejects.toMatchObject({ status: 403 });
    expect(prismaMock.contribution.createMany).not.toHaveBeenCalled();
  });

  it("creates one pending due per member for a group admin, keeping existing dues", async () => {
    prismaMock.group.findUnique.mockResolvedValue({ id: GROUP });
    prismaMock.membership.findFirst.mockResolvedValue({ id: "m-admin" });
    prismaMock.membership.findMany.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }]);
    prismaMock.contribution.createMany.mockResolvedValue({ count: 2 });

    const result = await contributionService.generateDues(ADMIN, input);

    expect(result).toEqual({ period: "2026-11", created: 2 });
    expect(prismaMock.contribution.createMany).toHaveBeenCalledWith({
      data: [
        { groupId: GROUP, userId: "u1", period: "2026-11", amount: 5000 },
        { groupId: GROUP, userId: "u2", period: "2026-11", amount: 5000 },
      ],
      skipDuplicates: true,
    });
  });

  it("lets a Super Admin generate dues for any group without a group membership", async () => {
    prismaMock.group.findUnique.mockResolvedValue({ id: GROUP });
    prismaMock.membership.findMany.mockResolvedValue([]);
    prismaMock.contribution.createMany.mockResolvedValue({ count: 0 });

    await contributionService.generateDues(SUPER, input);

    expect(prismaMock.membership.findFirst).not.toHaveBeenCalled();
  });
});

describe("contributionService.markPaid", () => {
  const due = { id: "c1", groupId: GROUP, userId: "u1", status: "PENDING" };

  it("rejects an unknown payment method", async () => {
    await expect(contributionService.markPaid(ADMIN, "c1", "CHEQUE")).rejects.toMatchObject({ status: 400 });
    expect(prismaMock.contribution.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the due does not exist", async () => {
    prismaMock.contribution.findUnique.mockResolvedValue(null);
    await expect(contributionService.markPaid(ADMIN, "c1", "CASH")).rejects.toMatchObject({ status: 404 });
  });

  it("refuses a member, even for their own due", async () => {
    prismaMock.contribution.findUnique.mockResolvedValue({ ...due, userId: MEMBER.userId });
    prismaMock.membership.findFirst.mockResolvedValue(null);
    await expect(contributionService.markPaid(MEMBER, "c1", "UPI")).rejects.toMatchObject({ status: 403 });
    expect(prismaMock.contribution.update).not.toHaveBeenCalled();
  });

  it("returns 409 when the due is already paid", async () => {
    prismaMock.contribution.findUnique.mockResolvedValue({ ...due, status: "PAID" });
    prismaMock.membership.findFirst.mockResolvedValue({ id: "m-admin" });
    await expect(contributionService.markPaid(ADMIN, "c1", "CASH")).rejects.toMatchObject({ status: 409 });
  });

  it("records the method, time and recorder, and writes an audit entry", async () => {
    prismaMock.contribution.findUnique.mockResolvedValue(due);
    prismaMock.membership.findFirst.mockResolvedValue({ id: "m-admin" });
    prismaMock.contribution.update.mockResolvedValue({ ...due, status: "PAID", method: "UPI" });
    prismaMock.auditLog.create.mockResolvedValue({});

    const updated = await contributionService.markPaid(ADMIN, "c1", "UPI");

    expect(updated).toMatchObject({ status: "PAID", method: "UPI" });
    const update = prismaMock.contribution.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: "c1" });
    expect(update.data).toMatchObject({ status: "PAID", method: "UPI", markedById: ADMIN.userId });
    expect(update.data.paidAt).toBeInstanceOf(Date);
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "CONTRIBUTION_PAID_UPI",
        entity: "Contribution",
        entityId: "c1",
        performedBy: ADMIN.userId,
      },
    });
  });

  it("lets a Super Admin mark any due paid", async () => {
    prismaMock.contribution.findUnique.mockResolvedValue(due);
    prismaMock.contribution.update.mockResolvedValue({ ...due, status: "PAID" });
    prismaMock.auditLog.create.mockResolvedValue({});

    await expect(contributionService.markPaid(SUPER, "c1", "CASH")).resolves.toMatchObject({ status: "PAID" });
    expect(prismaMock.membership.findFirst).not.toHaveBeenCalled();
  });
});

describe("contributionService.listDues", () => {
  it("refuses a member who is not a group admin", async () => {
    prismaMock.membership.findFirst.mockResolvedValue(null);
    await expect(contributionService.listDues(MEMBER, GROUP, undefined)).rejects.toMatchObject({ status: 403 });
  });

  it("rejects an unknown status filter", async () => {
    await expect(contributionService.listDues(ADMIN, GROUP, "LATE")).rejects.toMatchObject({ status: 400 });
  });

  it("filters by status for a group admin", async () => {
    prismaMock.membership.findFirst.mockResolvedValue({ id: "m-admin" });
    prismaMock.contribution.findMany.mockResolvedValue([]);

    await contributionService.listDues(ADMIN, GROUP, "PENDING");

    expect(prismaMock.contribution.findMany.mock.calls[0][0].where).toEqual({ groupId: GROUP, status: "PENDING" });
  });
});

describe("contributionService.listMyDues", () => {
  it("returns only the caller's dues", async () => {
    prismaMock.contribution.findMany.mockResolvedValue([]);
    await contributionService.listMyDues("member-1");
    expect(prismaMock.contribution.findMany.mock.calls[0][0].where).toEqual({ userId: "member-1" });
  });
});

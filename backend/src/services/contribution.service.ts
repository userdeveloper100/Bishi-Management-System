// src/services/contribution.service.ts
// Monthly dues per member and group, and the manual payment marking done by group admins.
import { prisma } from "../prismaClient";
import { HttpError, badRequest } from "../utils/httpError";
import { PAYMENT_METHODS, PaymentMethod, isSuperAdmin } from "../utils/roles";

export interface Caller {
  userId: string;
  role: string;
}

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;
const STATUSES = ["PENDING", "PAID"] as const;

/** Super admins manage every group. Anyone else must be an admin of that group. */
async function assertCanManageGroup(caller: Caller, groupId: string): Promise<void> {
  if (isSuperAdmin(caller.role)) return;
  const membership = await prisma.membership.findFirst({
    where: { userId: caller.userId, groupId, role: "admin" },
  });
  if (!membership) {
    throw new HttpError(403, "Only the group admin can manage dues for this group");
  }
}

function assertPeriod(period: unknown): string {
  if (typeof period !== "string" || !PERIOD.test(period)) {
    throw badRequest("period must be a month in YYYY-MM format");
  }
  return period;
}

function assertMethod(method: unknown): PaymentMethod {
  if (typeof method !== "string" || !(PAYMENT_METHODS as readonly string[]).includes(method)) {
    throw badRequest(`method must be one of: ${PAYMENT_METHODS.join(", ")}`);
  }
  return method as PaymentMethod;
}

export const contributionService = {
  /** Create a PENDING due for every active member of the group for one period. Existing dues are kept. */
  async generateDues(caller: Caller, input: { groupId: unknown; period: unknown; amount: unknown }) {
    if (typeof input.groupId !== "string" || !input.groupId) throw badRequest("groupId is required");
    const groupId = input.groupId;
    const period = assertPeriod(input.period);
    if (typeof input.amount !== "number" || !(input.amount > 0)) {
      throw badRequest("amount must be a positive number");
    }
    const amount = input.amount;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new HttpError(404, "Group not found");
    await assertCanManageGroup(caller, groupId);

    const memberships = await prisma.membership.findMany({
      where: { groupId, NOT: { status: "pending" } },
      select: { userId: true },
    });

    const result = await prisma.contribution.createMany({
      data: memberships.map((m) => ({ groupId, userId: m.userId, period, amount })),
      skipDuplicates: true,
    });
    return { period, created: result.count };
  },

  /** Dues for one group, optionally filtered by status. Only the group's admins can read them. */
  async listDues(caller: Caller, groupId: unknown, status: unknown) {
    if (typeof groupId !== "string" || !groupId) throw badRequest("groupId is required");
    if (status !== undefined && !(STATUSES as readonly unknown[]).includes(status)) {
      throw badRequest(`status must be one of: ${STATUSES.join(", ")}`);
    }
    await assertCanManageGroup(caller, groupId);

    return prisma.contribution.findMany({
      where: { groupId, ...(status ? { status: status as string } : {}) },
      include: { user: { select: { id: true, name: true, phone: true } } },
      orderBy: [{ status: "asc" }, { created_date: "asc" }],
    });
  },

  /**
   * Record that a due was settled in cash or by direct UPI. Writes the method, the time, and who
   * recorded it, plus an audit log entry, in one transaction.
   */
  async markPaid(caller: Caller, contributionId: string, methodInput: unknown) {
    const method = assertMethod(methodInput);
    const contribution = await prisma.contribution.findUnique({ where: { id: contributionId } });
    if (!contribution) throw new HttpError(404, "Due not found");
    await assertCanManageGroup(caller, contribution.groupId);
    if (contribution.status === "PAID") throw new HttpError(409, "This due is already marked as paid");

    const paidAt = new Date();
    return prisma.$transaction(async (tx) => {
      const updated = await tx.contribution.update({
        where: { id: contributionId },
        data: { status: "PAID", method, paidAt, markedById: caller.userId },
      });
      await tx.auditLog.create({
        data: {
          action: `CONTRIBUTION_PAID_${method}`,
          entity: "Contribution",
          entityId: contributionId,
          performedBy: caller.userId,
        },
      });
      return updated;
    });
  },

  /** The signed-in member's own dues, newest period first. */
  async listMyDues(userId: string) {
    return prisma.contribution.findMany({
      where: { userId },
      include: { group: { select: { id: true, name: true } } },
      orderBy: [{ period: "desc" }],
    });
  },
};

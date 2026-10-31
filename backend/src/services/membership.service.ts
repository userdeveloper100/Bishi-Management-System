import { prisma } from "../prismaClient";

export const membershipService = {
  async getAllMemberships() {
    return prisma.membership.findMany({
      include: { user: true, group: true },
    });
  },

  async getMembershipById(id: string) {
    return prisma.membership.findUnique({
      where: { id },
      include: { user: true, group: true },
    });
  },

  async createMembership({
    userId,
    groupId,
    role = "member",
    status = "pending",
    created_by,
  }: {
    userId: string;
    groupId: string;
    role?: string;
    status?: string;
    created_by?: string;
  }) {
    return prisma.membership.create({
      data: { userId, groupId, role, status, created_by },
      include: { user: true, group: true },
    });
  },

  async update(
    id: string,
    data: Partial<{
      role: string;
      status: string;
      modified_by: string;
    }>,
  ) {
    return prisma.membership.update({
      where: { id },
      data,
      include: { user: true, group: true },
    });
  },

  async remove(id: string) {
    return prisma.membership.delete({
      where: { id },
    });
  },
};

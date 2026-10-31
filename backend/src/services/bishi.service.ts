// src/services/bishi.service.ts
import { prisma } from "../prismaClient";

export const bishiService = {
  async getAll() {
    return prisma.bishi.findMany({
      include: { group: true, owner: true, transactions: true },
    });
  },

  async getById(id: string) {
    return prisma.bishi.findUnique({
      where: { id },
      include: { group: true, owner: true, transactions: true },
    });
  },

  async create(data: {
    title: string;
    description?: string;
    groupId: string;
    ownerId: string;
  }) {
    return prisma.bishi.create({ data });
  },

  async update(
    id: string,
    data: Partial<{ title: string; description: string }>,
  ) {
    return prisma.bishi.update({ where: { id }, data });
  },

  async remove(id: string) {
    return prisma.bishi.delete({ where: { id } });
  },
};

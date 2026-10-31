// src/services/transaction.service.ts
import { prisma } from "../prismaClient";

export const transactionService = {
  async getAll() {
    return prisma.transaction.findMany({
      include: { user: true, bishi: true },
      orderBy: { created_date: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: { user: true, bishi: true },
    });
  },

  async create(data: { amount: number; bishiId: string; userId: string }) {
    return prisma.transaction.create({ data });
  },

  update: async (id: string, data: any) => {
    return prisma.transaction.update({
      where: { id },
      data,
    });
  },

  async remove(id: string) {
    return prisma.transaction.delete({ where: { id } });
  },
};

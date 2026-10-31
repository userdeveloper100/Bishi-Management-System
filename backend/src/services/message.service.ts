// src/services/message.service.ts
import { prisma } from "../prismaClient";

export const messageService = {
  getAll: async () => {
    return prisma.message.findMany();
  },

  async getByGroup(groupId: string) {
    return prisma.message.findMany({
      where: { groupId },
      orderBy: { created_date: "asc" },
    });
  },

  async getById(id: string) {
    return prisma.message.findUnique({ where: { id } });
  },

  async create(data: { content: string; groupId: string; userId: string }) {
    return prisma.message.create({ data });
  },

  update: async (id: string, data: any) => {
    return prisma.message.update({
      where: { id },
      data,
    });
  },

  async remove(id: string) {
    return prisma.message.delete({ where: { id } });
  },
};

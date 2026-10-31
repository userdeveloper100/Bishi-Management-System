// src/services/audit.service.ts
import { prisma } from "../prismaClient";

export const auditService = {
  async getAll() {
    return prisma.auditLog.findMany({ orderBy: { created_date: "desc" } });
  },

  getById: async (id: string) => {
    return prisma.auditLog.findUnique({
      where: { id },
    });
  },

  async create(data: {
    action: string;
    entity: string;
    entityId: string;
    performedBy: string;
  }) {
    return prisma.auditLog.create({ data });
  },

  update: async (id: string, data: any) => {
    return prisma.auditLog.update({
      where: { id },
      data,
    });
  },

  remove: async (id: string) => {
    return prisma.auditLog.delete({
      where: { id },
    });
  },
};

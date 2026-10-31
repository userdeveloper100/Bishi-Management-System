// src/services/notification.service.ts
import { prisma } from "../prismaClient";

export const notificationService = {
    async getAll() {
        return prisma.notification.findMany({
            include: { user: true },
            orderBy: { created_date: "desc" },
        });
    },


    async getById(id: string) {
        return prisma.notification.findUnique({
            where: { id },
        });
    },

    async getByUser(userId: string) {
        return prisma.notification.findMany({
            where: { userId },
            orderBy: { created_date: "desc" },
        });
    },

    async create(data: { message: string; userId: string }) {
        return prisma.notification.create({ data });
    },

    async update(id: string, data: any) {
        return prisma.notification.update({
            where: { id },
            data,
        });
    },

    async remove(id: string) {
        return prisma.notification.delete({ where: { id } });
    },
};

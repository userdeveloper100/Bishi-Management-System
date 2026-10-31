import { prisma } from '../prismaClient';
export const groupService = {
    async getAll() {
        return prisma.group.findMany();
    },

    async getById(id: string) {
        return prisma.group.findUnique({ where: { id } });
    },

    async create(data: any) {
        return prisma.group.create({ data });
    },

    async update(id: string, data: any) {
        return prisma.group.update({ where: { id }, data });
    },

    async remove(id: string) {
        return prisma.group.delete({ where: { id } });
    }
};

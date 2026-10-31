import { prisma } from '../prismaClient';
import { GroupRow, summariseContributions, toGroupSummary } from './group.mapper';

export const groupService = {
    /**
     * Groups the caller belongs to (accepted or pending membership) or owns through a bishi.
     * Admins see every group, because they manage the whole system.
     */
    async getForUser(userId: string, isAdmin: boolean) {
        const groups = await prisma.group.findMany({
            where: isAdmin
                ? undefined
                : {
                    OR: [
                        { membership: { some: { userId } } },
                        { bishis: { some: { ownerId: userId } } },
                    ],
                },
            include: {
                membership: { select: { userId: true, role: true, status: true } },
                bishis: { select: { ownerId: true } },
            },
            orderBy: { created_date: 'desc' },
        });

        const totals = await prisma.transaction.aggregate({
            where: { userId },
            _sum: { amount: true },
            _count: { _all: true },
        });

        return {
            summary: summariseContributions(totals._sum.amount, totals._count._all),
            groups: (groups as GroupRow[]).map((group) => toGroupSummary(group, userId)),
        };
    },

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

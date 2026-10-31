import { prismaMock } from "../helpers/prismaMock";
import { groupService } from "../../src/services/group.service";

jest.mock("../../src/prismaClient", () => ({ prisma: require("../helpers/prismaMock").prismaMock }));

const groupRow = {
    id: "g1",
    name: "Test Bhishi",
    cycleMonths: 10,
    monthlyContribution: 32000,
    status: "BIDDING",
    nextBidRound: 4,
    nextBidAt: new Date("2026-11-01T13:30:00.000Z"),
    membership: [
        { userId: "u1", role: "member", status: "accepted" },
        { userId: "u2", role: "member", status: "accepted" },
        { userId: "u3", role: "member", status: "pending" },
    ],
    bishis: [],
};

describe("groupService.getForUser", () => {
    it("limits a regular user to groups they belong to or own", async () => {
        prismaMock.group.findMany.mockResolvedValue([groupRow]);
        prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 96000 }, _count: { _all: 3 } });

        await groupService.getForUser("u1", false);

        const where = prismaMock.group.findMany.mock.calls[0][0].where;
        expect(where).toEqual({
            OR: [
                { membership: { some: { userId: "u1" } } },
                { bishis: { some: { ownerId: "u1" } } },
            ],
        });
    });

    it("does not filter groups for admins", async () => {
        prismaMock.group.findMany.mockResolvedValue([]);
        prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: null }, _count: { _all: 0 } });

        await groupService.getForUser("admin-1", true);

        expect(prismaMock.group.findMany.mock.calls[0][0].where).toBeUndefined();
    });

    it("returns the caller's contribution totals and the mapped groups", async () => {
        prismaMock.group.findMany.mockResolvedValue([groupRow]);
        prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: 96000 }, _count: { _all: 3 } });

        const result = await groupService.getForUser("u1", false);

        expect(prismaMock.transaction.aggregate.mock.calls[0][0].where).toEqual({ userId: "u1" });
        expect(result.summary).toEqual({ totalSavings: 96000, contributionsCount: 3 });
        expect(result.groups).toEqual([
            {
                id: "g1",
                name: "Test Bhishi",
                memberCount: 2,
                cycleMonths: 10,
                monthlyContribution: 32000,
                status: "BIDDING",
                nextBid: { round: 4, at: "2026-11-01T13:30:00.000Z" },
                role: "member",
            },
        ]);
    });

    it("returns zero totals when the caller has no contributions", async () => {
        prismaMock.group.findMany.mockResolvedValue([]);
        prismaMock.transaction.aggregate.mockResolvedValue({ _sum: { amount: null }, _count: { _all: 0 } });

        await expect(groupService.getForUser("u9", false)).resolves.toEqual({
            summary: { totalSavings: 0, contributionsCount: 0 },
            groups: [],
        });
    });
});

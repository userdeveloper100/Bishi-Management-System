// In-memory stand-in for the Prisma client. Tests set return values per call.
// Import this module and pass it to jest.mock("../../src/prismaClient") so services use it.
export const prismaMock: any = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    role: { findUnique: jest.fn() },
    otpCode: {
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
    },
    group: { findMany: jest.fn() },
    transaction: { aggregate: jest.fn() },
    notification: { findMany: jest.fn() },
};

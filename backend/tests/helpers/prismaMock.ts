// In-memory stand-in for the Prisma client. Tests set return values per call.
// Import this module and pass it to jest.mock("../../src/prismaClient") so services use it.
export const prismaMock: any = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  role: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  permission: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  rolePermission: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  otpCode: {
    findFirst: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  group: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  bishi: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  transaction: { aggregate: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
  notification: { findMany: jest.fn() },
  message: { deleteMany: jest.fn() },
  membership: { findFirst: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
  contribution: {
    count: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
  },
  auditLog: { create: jest.fn(), findMany: jest.fn() },
  // Run the transaction callback against the same mock, so tx.* calls are recorded too.
  $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(prismaMock)),
};

import bcrypt from "bcrypt";
import { prisma } from "../prismaClient";

// Read at call time: dotenv loads after the imports run in server.ts.
const saltRounds = () => Number(process.env.BCRYPT_SALT_ROUNDS || 10);

// Password hashes are never returned to clients.
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  roleId: true,
  created_by: true,
  created_date: true,
  modified_by: true,
  modified_date: true,
} as const;

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
}

export const userService = {
  async getAll() {
    return prisma.user.findMany({ select: publicUserSelect });
  },

  async getById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  },

  async create(data: CreateUserInput) {
    const password = await bcrypt.hash(data.password, saltRounds());
    return prisma.user.create({
      data: { ...data, password },
      select: publicUserSelect,
    });
  },

  async update(id: string, data: UpdateUserInput) {
    const password =
      data.password === undefined
        ? undefined
        : await bcrypt.hash(data.password, saltRounds());
    return prisma.user.update({
      where: { id },
      data: { ...data, password },
      select: publicUserSelect,
    });
  },

  async remove(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};

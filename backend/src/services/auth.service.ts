import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { prisma } from "../prismaClient";
import { HttpError } from "../utils/httpError";

const JWT_SECRET = process.env.JWT_SECRET!;
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

/** Message used whenever a phone number has no account. Shared with the OTP service. */
export const NO_ACCOUNT_MESSAGE = "No account is registered for this phone number";

/** Role with its permission names, read from Role, RolePermission, and Permission. */
const ROLE_SELECT = {
  name: true,
  permissions: { select: { permission: { select: { name: true } } } },
} as const;

interface RoleRow {
  name: string;
  permissions: { permission: { name: string } }[];
}

export interface AccessInfo {
  role: string;
  permissions: string[];
}

/** Turns a Role row into the role name and sorted permission names used in tokens and responses. */
export function toAccess(role: RoleRow | null | undefined): AccessInfo {
  return {
    role: role?.name || "user",
    permissions: (role?.permissions ?? []).map((p) => p.permission.name).sort(),
  };
}

export const authService = {
  /**
   * Register a new user
   */
  async register(
    name: string,
    email: string,
    password: string,
    roleName = "user",
  ) {
    const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // 🔑 Find role by name (default "user")
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new Error(`Role "${roleName}" not found in database`);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        roleId: role.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_date: true,
        role: { select: { name: true } },
      },
    });

    return user;
  },

  /**
   * Login user and return JWT
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: { select: ROLE_SELECT },
      },
    });

    // Phone-only accounts have no password, so they cannot log in with email.
    if (!user || !user.password) throw new Error("Invalid email or password");

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error("Invalid email or password");

    const access = toAccess(user.role as RoleRow | null);

    const token = this.generateToken({
      id: user.id,
      role: access.role,
      permissions: access.permissions,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: access.role,
        permissions: access.permissions,
      },
    };
  },

  /**
   * Log in an existing user after their phone number has been verified by OTP.
   * The phone must belong to an account in the database; unknown numbers get a 404.
   * The token and response carry the role and permissions from the database.
   */
  async loginWithPhone(phone: string) {
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        role: { select: ROLE_SELECT },
      },
    });
    if (!user) throw new HttpError(404, NO_ACCOUNT_MESSAGE);

    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });

    const access = toAccess(user.role as RoleRow | null);
    const token = this.generateToken({
      id: user.id,
      role: access.role,
      permissions: access.permissions,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: access.role,
        permissions: access.permissions,
      },
    };
  },

  /**
   * Generate JWT Token. The payload carries the user id, role name, and permission names.
   */
  generateToken(user: { id: string; role: string; permissions?: string[] }) {
    const payload = {
      userId: user.id,
      role: user.role,
      permissions: user.permissions ?? [],
    };

    const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN ||
        "1d") as SignOptions["expiresIn"],
    };

    return jwt.sign(payload, JWT_SECRET as Secret, options);
  },
};

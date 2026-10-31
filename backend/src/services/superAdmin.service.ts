// src/services/superAdmin.service.ts
// Master data for Super Admins: users, roles, permissions, role-permission links, groups, bishis.
// Transactions and audit logs are read-only views. Every change writes an AuditLog entry.
import bcrypt from "bcrypt";
import { prisma } from "../prismaClient";
import { HttpError, badRequest, notFound } from "../utils/httpError";
import { normalizePhone } from "../utils/phone";
import { optionalNumber, optionalString, requireNumber, requireString } from "../utils/validation";

const saltRounds = () => Number(process.env.BCRYPT_SALT_ROUNDS || 10);
/** Read endpoints return at most this many rows, newest first. */
const LIST_LIMIT = 200;
const GROUP_STATUSES = ["OPEN", "BIDDING", "CLOSED"] as const;

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  phoneVerified: true,
  language: true,
  roleId: true,
  role: { select: { id: true, name: true } },
  created_date: true,
} as const;

type Actor = string;

/** Record an admin change. The action names the entity and the operation. */
async function audit(actor: Actor, op: "CREATE" | "UPDATE" | "DELETE", entity: string, entityId: string) {
  await prisma.auditLog.create({
    data: { action: `SUPER_ADMIN_${op}`, entity, entityId, performedBy: actor },
  });
}

/** Turn a foreign-key failure on delete into a clear 409. */
async function deleteOrConflict<T>(run: () => Promise<T>, message: string): Promise<T> {
  try {
    return await run();
  } catch (err: any) {
    if (err?.code === "P2003") throw new HttpError(409, message);
    throw err;
  }
}

async function requireRole(roleId: string): Promise<void> {
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
  if (!role) throw badRequest("roleId does not match a role");
}

async function requirePermission(permissionId: string): Promise<void> {
  const permission = await prisma.permission.findUnique({ where: { id: permissionId }, select: { id: true } });
  if (!permission) throw badRequest("permissionId does not match a permission");
}

function optionalNullableString(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return requireString(value, field);
}

function requireGroupStatus(value: unknown): (typeof GROUP_STATUSES)[number] {
  if (typeof value !== "string" || !(GROUP_STATUSES as readonly string[]).includes(value)) {
    throw badRequest(`status must be one of ${GROUP_STATUSES.join(", ")}`);
  }
  return value as (typeof GROUP_STATUSES)[number];
}

async function hashIfPresent(password: unknown): Promise<string | undefined> {
  if (password === undefined || password === null || password === "") return undefined;
  return bcrypt.hash(requireString(password, "password"), saltRounds());
}

// ---------- Users ----------

export const superAdminUsers = {
  list() {
    return prisma.user.findMany({ select: USER_SELECT, orderBy: { created_date: "desc" }, take: LIST_LIMIT });
  },

  async get(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw notFound("User not found");
    return user;
  },

  async create(actor: Actor, body: Record<string, unknown>) {
    const phone = normalizePhone(body.phone);
    const roleId = requireString(body.roleId, "roleId");
    await requireRole(roleId);
    const user = await prisma.user.create({
      data: {
        name: requireString(body.name, "name"),
        email: optionalNullableString(body.email, "email") ?? null,
        phone,
        password: await hashIfPresent(body.password),
        roleId,
      },
      select: USER_SELECT,
    });
    await audit(actor, "CREATE", "User", user.id);
    return user;
  },

  async update(actor: Actor, id: string, body: Record<string, unknown>) {
    const roleId = optionalString(body.roleId, "roleId");
    if (roleId !== undefined) await requireRole(roleId);
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: optionalString(body.name, "name"),
        email: optionalNullableString(body.email, "email"),
        phone: body.phone === undefined ? undefined : normalizePhone(body.phone),
        password: await hashIfPresent(body.password),
        roleId,
      },
      select: USER_SELECT,
    });
    await audit(actor, "UPDATE", "User", id);
    return user;
  },

  async remove(actor: Actor, id: string) {
    if (id === actor) throw badRequest("You cannot delete your own account");
    await deleteOrConflict(
      () => prisma.user.delete({ where: { id } }),
      "This user has group, payment or other linked records and cannot be deleted",
    );
    await audit(actor, "DELETE", "User", id);
  },
};

// ---------- Roles ----------

export const superAdminRoles = {
  list() {
    return prisma.role.findMany({
      select: { id: true, name: true, description: true, _count: { select: { users: true, permissions: true } } },
      orderBy: { name: "asc" },
    });
  },

  async get(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        permissions: { select: { id: true, permission: { select: { id: true, name: true } } } },
      },
    });
    if (!role) throw notFound("Role not found");
    return role;
  },

  async create(actor: Actor, body: Record<string, unknown>) {
    const role = await prisma.role.create({
      data: {
        name: requireString(body.name, "name"),
        description: optionalNullableString(body.description, "description") ?? null,
      },
    });
    await audit(actor, "CREATE", "Role", role.id);
    return role;
  },

  async update(actor: Actor, id: string, body: Record<string, unknown>) {
    const role = await prisma.role.update({
      where: { id },
      data: {
        name: optionalString(body.name, "name"),
        description: optionalNullableString(body.description, "description"),
      },
    });
    await audit(actor, "UPDATE", "Role", id);
    return role;
  },

  async remove(actor: Actor, id: string) {
    const users = await prisma.user.count({ where: { roleId: id } });
    if (users > 0) throw new HttpError(409, "This role still has users. Move them to another role first.");
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.role.delete({ where: { id } });
    });
    await audit(actor, "DELETE", "Role", id);
  },
};

// ---------- Permissions ----------

export const superAdminPermissions = {
  list() {
    return prisma.permission.findMany({
      select: { id: true, name: true, description: true, _count: { select: { roles: true } } },
      orderBy: { name: "asc" },
    });
  },

  async get(id: string) {
    const permission = await prisma.permission.findUnique({
      where: { id },
      select: { id: true, name: true, description: true },
    });
    if (!permission) throw notFound("Permission not found");
    return permission;
  },

  async create(actor: Actor, body: Record<string, unknown>) {
    const permission = await prisma.permission.create({
      data: {
        name: requireString(body.name, "name"),
        description: optionalNullableString(body.description, "description") ?? null,
      },
    });
    await audit(actor, "CREATE", "Permission", permission.id);
    return permission;
  },

  async update(actor: Actor, id: string, body: Record<string, unknown>) {
    const permission = await prisma.permission.update({
      where: { id },
      data: {
        name: optionalString(body.name, "name"),
        description: optionalNullableString(body.description, "description"),
      },
    });
    await audit(actor, "UPDATE", "Permission", id);
    return permission;
  },

  async remove(actor: Actor, id: string) {
    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { permissionId: id } });
      await tx.permission.delete({ where: { id } });
    });
    await audit(actor, "DELETE", "Permission", id);
  },
};

// ---------- Role-permission links ----------

export const superAdminRolePermissions = {
  list(roleId?: string) {
    return prisma.rolePermission.findMany({
      where: roleId ? { roleId } : undefined,
      select: {
        id: true,
        roleId: true,
        permissionId: true,
        role: { select: { name: true } },
        permission: { select: { name: true } },
      },
      orderBy: [{ role: { name: "asc" } }, { permission: { name: "asc" } }],
      take: LIST_LIMIT,
    });
  },

  async assign(actor: Actor, body: Record<string, unknown>) {
    const roleId = requireString(body.roleId, "roleId");
    const permissionId = requireString(body.permissionId, "permissionId");
    await requireRole(roleId);
    await requirePermission(permissionId);
    try {
      const link = await prisma.rolePermission.create({ data: { roleId, permissionId } });
      await audit(actor, "CREATE", "RolePermission", link.id);
      return link;
    } catch (err: any) {
      if (err?.code === "P2002") throw new HttpError(409, "This permission is already assigned to the role");
      throw err;
    }
  },

  async revoke(actor: Actor, id: string) {
    await prisma.rolePermission.delete({ where: { id } });
    await audit(actor, "DELETE", "RolePermission", id);
  },
};

// ---------- Groups ----------

const GROUP_SELECT = {
  id: true,
  name: true,
  cycleMonths: true,
  monthlyContribution: true,
  status: true,
  nextBidRound: true,
  nextBidAt: true,
  _count: { select: { membership: true, bishis: true } },
} as const;

export const superAdminGroups = {
  list() {
    return prisma.group.findMany({ select: GROUP_SELECT, orderBy: { created_date: "desc" }, take: LIST_LIMIT });
  },

  async get(id: string) {
    const group = await prisma.group.findUnique({ where: { id }, select: GROUP_SELECT });
    if (!group) throw notFound("Group not found");
    return group;
  },

  async create(actor: Actor, body: Record<string, unknown>) {
    const group = await prisma.group.create({
      data: {
        name: requireString(body.name, "name"),
        cycleMonths: requireNumber(body.cycleMonths, "cycleMonths"),
        monthlyContribution: requireNumber(body.monthlyContribution, "monthlyContribution"),
        status: body.status === undefined ? "OPEN" : requireGroupStatus(body.status),
      },
      select: GROUP_SELECT,
    });
    await audit(actor, "CREATE", "Group", group.id);
    return group;
  },

  async update(actor: Actor, id: string, body: Record<string, unknown>) {
    const group = await prisma.group.update({
      where: { id },
      data: {
        name: optionalString(body.name, "name"),
        cycleMonths: optionalNumber(body.cycleMonths, "cycleMonths"),
        monthlyContribution: optionalNumber(body.monthlyContribution, "monthlyContribution"),
        status: body.status === undefined ? undefined : requireGroupStatus(body.status),
      },
      select: GROUP_SELECT,
    });
    await audit(actor, "UPDATE", "Group", id);
    return group;
  },

  async remove(actor: Actor, id: string) {
    // A group with recorded dues or payments is kept, so the payment history is not lost.
    const dues = await prisma.contribution.count({ where: { groupId: id } });
    if (dues > 0) throw new HttpError(409, "This group has dues or payments recorded and cannot be deleted");
    await prisma.$transaction(async (tx) => {
      const bishis = await tx.bishi.findMany({ where: { groupId: id }, select: { id: true } });
      await tx.transaction.deleteMany({ where: { bishiId: { in: bishis.map((b) => b.id) } } });
      await tx.bishi.deleteMany({ where: { groupId: id } });
      await tx.membership.deleteMany({ where: { groupId: id } });
      await tx.message.deleteMany({ where: { groupId: id } });
      await tx.group.delete({ where: { id } });
    });
    await audit(actor, "DELETE", "Group", id);
  },
};

// ---------- Bishis (rounds) ----------

export const superAdminBishis = {
  list() {
    return prisma.bishi.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        groupId: true,
        ownerId: true,
        group: { select: { name: true } },
        owner: { select: { name: true } },
      },
      orderBy: { created_date: "desc" },
      take: LIST_LIMIT,
    });
  },

  async get(id: string) {
    const bishi = await prisma.bishi.findUnique({
      where: { id },
      select: { id: true, title: true, description: true, groupId: true, ownerId: true },
    });
    if (!bishi) throw notFound("Bishi not found");
    return bishi;
  },

  async create(actor: Actor, body: Record<string, unknown>) {
    const groupId = requireString(body.groupId, "groupId");
    const ownerId = requireString(body.ownerId, "ownerId");
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { id: true } });
    if (!group) throw badRequest("groupId does not match a group");
    const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { id: true } });
    if (!owner) throw badRequest("ownerId does not match a user");
    const bishi = await prisma.bishi.create({
      data: {
        title: requireString(body.title, "title"),
        description: optionalNullableString(body.description, "description") ?? null,
        groupId,
        ownerId,
      },
    });
    await audit(actor, "CREATE", "Bishi", bishi.id);
    return bishi;
  },

  async update(actor: Actor, id: string, body: Record<string, unknown>) {
    const bishi = await prisma.bishi.update({
      where: { id },
      data: {
        title: optionalString(body.title, "title"),
        description: optionalNullableString(body.description, "description"),
      },
    });
    await audit(actor, "UPDATE", "Bishi", id);
    return bishi;
  },

  async remove(actor: Actor, id: string) {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { bishiId: id } });
      await tx.bishi.delete({ where: { id } });
    });
    await audit(actor, "DELETE", "Bishi", id);
  },
};

// ---------- Read-only views ----------

export const superAdminViews = {
  transactions() {
    return prisma.transaction.findMany({
      select: {
        id: true,
        amount: true,
        bishiId: true,
        userId: true,
        bishi: { select: { title: true } },
        user: { select: { name: true } },
        created_date: true,
      },
      orderBy: { created_date: "desc" },
      take: LIST_LIMIT,
    });
  },

  auditLogs() {
    return prisma.auditLog.findMany({ orderBy: { created_date: "desc" }, take: LIST_LIMIT });
  },
};

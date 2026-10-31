import { prismaMock } from "../helpers/prismaMock";
import {
  superAdminBishis,
  superAdminGroups,
  superAdminRolePermissions,
  superAdminRoles,
  superAdminUsers,
} from "../../src/services/superAdmin.service";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));

const ACTOR = "super-1";

beforeEach(() => {
  // resetMocks clears the transaction helper, so run the callback against the mock again.
  prismaMock.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prismaMock));
});

/** A Prisma error with the given code, as the client throws it. */
function prismaError(code: string) {
  return Object.assign(new Error(`prisma ${code}`), { code });
}

describe("superAdminUsers.create", () => {
  it("normalises the phone, checks the role, stores the user, and writes an audit entry", async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: "role-user" });
    prismaMock.user.create.mockResolvedValue({ id: "u9", name: "Asha" });
    prismaMock.auditLog.create.mockResolvedValue({});

    await superAdminUsers.create(ACTOR, {
      name: "Asha",
      phone: "98765 43210",
      roleId: "role-user",
    });

    const { data } = prismaMock.user.create.mock.calls[0][0];
    expect(data).toMatchObject({ name: "Asha", phone: "+919876543210", roleId: "role-user", email: null });
    expect(data.password).toBeUndefined();
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: { action: "SUPER_ADMIN_CREATE", entity: "User", entityId: "u9", performedBy: ACTOR },
    });
  });

  it("hashes the password when one is given", async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: "role-user" });
    prismaMock.user.create.mockResolvedValue({ id: "u9" });
    prismaMock.auditLog.create.mockResolvedValue({});

    await superAdminUsers.create(ACTOR, {
      name: "Asha",
      phone: "9876543210",
      roleId: "role-user",
      password: "a-long-password",
    });

    const { data } = prismaMock.user.create.mock.calls[0][0];
    expect(data.password).toMatch(/^\$2[aby]\$/);
    expect(data.password).not.toBe("a-long-password");
  });

  it("refuses a missing or malformed phone with 400 and creates nothing", async () => {
    await expect(
      superAdminUsers.create(ACTOR, { name: "Asha", roleId: "role-user" }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      superAdminUsers.create(ACTOR, { name: "Asha", phone: "12345", roleId: "role-user" }),
    ).rejects.toMatchObject({ status: 400 });

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("refuses an unknown role with 400", async () => {
    prismaMock.role.findUnique.mockResolvedValue(null);

    await expect(
      superAdminUsers.create(ACTOR, { name: "Asha", phone: "9876543210", roleId: "nope" }),
    ).rejects.toMatchObject({ status: 400, message: "roleId does not match a role" });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe("superAdminUsers.remove", () => {
  it("refuses to delete the signed-in Super Admin's own account", async () => {
    await expect(superAdminUsers.remove(ACTOR, ACTOR)).rejects.toMatchObject({ status: 400 });
    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it("returns 409 when the user still has linked records", async () => {
    prismaMock.user.delete.mockRejectedValue(prismaError("P2003"));

    await expect(superAdminUsers.remove(ACTOR, "u2")).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.auditLog.create).not.toHaveBeenCalled();
  });
});

describe("superAdminRoles.remove", () => {
  it("refuses while users still hold the role, and deletes nothing", async () => {
    prismaMock.user.count.mockResolvedValue(3);

    await expect(superAdminRoles.remove(ACTOR, "role-user")).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.role.delete).not.toHaveBeenCalled();
    expect(prismaMock.rolePermission.deleteMany).not.toHaveBeenCalled();
  });

  it("removes the role's permission links, then the role, in one transaction", async () => {
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.rolePermission.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.role.delete.mockResolvedValue({});
    prismaMock.auditLog.create.mockResolvedValue({});

    await superAdminRoles.remove(ACTOR, "role-old");

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.rolePermission.deleteMany).toHaveBeenCalledWith({ where: { roleId: "role-old" } });
    expect(prismaMock.role.delete).toHaveBeenCalledWith({ where: { id: "role-old" } });
  });
});

describe("superAdminRolePermissions.assign", () => {
  it("returns 409 when the permission is already on the role", async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: "r1" });
    prismaMock.permission.findUnique.mockResolvedValue({ id: "p1" });
    prismaMock.rolePermission.create.mockRejectedValue(prismaError("P2002"));

    await expect(
      superAdminRolePermissions.assign(ACTOR, { roleId: "r1", permissionId: "p1" }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("returns 400 when the permission does not exist", async () => {
    prismaMock.role.findUnique.mockResolvedValue({ id: "r1" });
    prismaMock.permission.findUnique.mockResolvedValue(null);

    await expect(
      superAdminRolePermissions.assign(ACTOR, { roleId: "r1", permissionId: "missing" }),
    ).rejects.toMatchObject({ status: 400 });
    expect(prismaMock.rolePermission.create).not.toHaveBeenCalled();
  });
});

describe("superAdminGroups.remove", () => {
  it("refuses a group that has dues or payments recorded", async () => {
    prismaMock.contribution.count.mockResolvedValue(4);

    await expect(superAdminGroups.remove(ACTOR, "g1")).rejects.toMatchObject({ status: 409 });
    expect(prismaMock.group.delete).not.toHaveBeenCalled();
  });

  it("removes a group with no payments, after its memberships, messages and rounds", async () => {
    prismaMock.contribution.count.mockResolvedValue(0);
    prismaMock.bishi.findMany.mockResolvedValue([{ id: "b1" }]);
    prismaMock.auditLog.create.mockResolvedValue({});

    await superAdminGroups.remove(ACTOR, "g1");

    expect(prismaMock.transaction.deleteMany).toHaveBeenCalledWith({ where: { bishiId: { in: ["b1"] } } });
    expect(prismaMock.membership.deleteMany).toHaveBeenCalledWith({ where: { groupId: "g1" } });
    expect(prismaMock.group.delete).toHaveBeenCalledWith({ where: { id: "g1" } });
  });
});

describe("superAdminBishis.create", () => {
  it("refuses a group or owner that does not exist", async () => {
    prismaMock.group.findUnique.mockResolvedValue(null);

    await expect(
      superAdminBishis.create(ACTOR, { title: "Round 1", groupId: "g404", ownerId: "u1" }),
    ).rejects.toMatchObject({ status: 400, message: "groupId does not match a group" });
    expect(prismaMock.bishi.create).not.toHaveBeenCalled();
  });
});

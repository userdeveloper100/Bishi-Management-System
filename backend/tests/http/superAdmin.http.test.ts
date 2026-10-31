import request from "supertest";
import jwt from "jsonwebtoken";
import { prismaMock } from "../helpers/prismaMock";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));

// Imported after the mocks so the app picks up the mocked prisma client.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../../src/app").default;

/** A token for a user. The guard reads the role from the database, not from this claim. */
function tokenFor(userId: string) {
  return `Bearer ${jwt.sign({ userId, role: "super_admin", permissions: [] }, process.env.JWT_SECRET as string)}`;
}

beforeEach(() => {
  // resetMocks clears the transaction helper, so run the callback against the mock again.
  prismaMock.$transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback(prismaMock));
});

/** The database role that requireSuperAdmin reads on each request. */
function dbRoleIs(name: string) {
  prismaMock.user.findUnique.mockResolvedValue({ role: { name } });
}

/** Every master route, with the method that mutates or reads it. */
const ROUTES: Array<[string, string]> = [
  ["get", "/api/super-admin/users"],
  ["post", "/api/super-admin/users"],
  ["get", "/api/super-admin/users/u1"],
  ["delete", "/api/super-admin/users/u1"],
  ["get", "/api/super-admin/roles"],
  ["post", "/api/super-admin/roles"],
  ["delete", "/api/super-admin/roles/r1"],
  ["get", "/api/super-admin/permissions"],
  ["post", "/api/super-admin/permissions"],
  ["get", "/api/super-admin/role-permissions"],
  ["post", "/api/super-admin/role-permissions"],
  ["delete", "/api/super-admin/role-permissions/rp1"],
  ["get", "/api/super-admin/groups"],
  ["put", "/api/super-admin/groups/g1"],
  ["get", "/api/super-admin/bishis"],
  ["delete", "/api/super-admin/bishis/b1"],
  ["get", "/api/super-admin/transactions"],
  ["get", "/api/super-admin/audit-logs"],
];

describe("/api/super-admin is Super Admin only", () => {
  it.each(ROUTES)("%s %s returns 401 without a token", async (method, path) => {
    const res = await (request(app) as any)[method](path);

    expect(res.status).toBe(401);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it.each([["admin"], ["user"]])("returns 403 for a %s on every master route", async (role) => {
    dbRoleIs(role);
    const auth = tokenFor("u-other");

    for (const [method, path] of ROUTES) {
      const res = await (request(app) as any)[method](path).set("Authorization", auth).send({});
      expect({ method, path, status: res.status }).toEqual({ method, path, status: 403 });
    }
    expect(prismaMock.role.findMany).not.toHaveBeenCalled();
    expect(prismaMock.auditLog.findMany).not.toHaveBeenCalled();
  });

  it("lets a super_admin read the roles list", async () => {
    dbRoleIs("super_admin");
    prismaMock.role.findMany.mockResolvedValue([{ id: "r1", name: "super_admin" }]);

    const res = await request(app).get("/api/super-admin/roles").set("Authorization", tokenFor("s1"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "r1", name: "super_admin" }]);
  });

  it("returns 400 for a super_admin creating a user with a malformed phone", async () => {
    dbRoleIs("super_admin");

    const res = await request(app)
      .post("/api/super-admin/users")
      .set("Authorization", tokenFor("s1"))
      .send({ name: "Asha", phone: "12345", roleId: "r1" });

    expect(res.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 for a super_admin creating a role without a name", async () => {
    dbRoleIs("super_admin");

    const res = await request(app)
      .post("/api/super-admin/roles")
      .set("Authorization", tokenFor("s1"))
      .send({ description: "no name" });

    expect(res.status).toBe(400);
    expect(prismaMock.role.create).not.toHaveBeenCalled();
  });

  it("lets a super_admin delete an unused role", async () => {
    dbRoleIs("super_admin");
    prismaMock.user.count.mockResolvedValue(0);
    prismaMock.rolePermission.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.role.delete.mockResolvedValue({});
    prismaMock.auditLog.create.mockResolvedValue({});

    const res = await request(app).delete("/api/super-admin/roles/r-old").set("Authorization", tokenFor("s1"));

    expect(res.status).toBe(204);
    expect(prismaMock.role.delete).toHaveBeenCalledWith({ where: { id: "r-old" } });
  });
});

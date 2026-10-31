import { prismaMock } from "../helpers/prismaMock";
import { requireSuperAdmin } from "../../src/middlewares/superAdmin";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

/** The role lookup returns the user's role name from the database. */
function roleInDb(name: string | null) {
  prismaMock.user.findUnique.mockResolvedValue({
    role: name === null ? null : { name },
  });
}

describe("requireSuperAdmin", () => {
  it("returns 401 when the request has no signed-in user", async () => {
    const res = mockRes();
    const next = jest.fn();

    await requireSuperAdmin({ user: undefined } as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("lets a super_admin through, after reading the role from the database", async () => {
    roleInDb("super_admin");
    const res = mockRes();
    const next = jest.fn();

    await requireSuperAdmin({ user: { userId: "u1", role: "user" } } as any, res, next);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { role: { select: { name: true } } },
    });
    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([["admin"], ["user"]])("returns 403 for a %s, whatever the token says", async (role) => {
    roleInDb(role);
    const res = mockRes();
    const next = jest.fn();

    // The token claims super_admin, but the database role is what counts.
    await requireSuperAdmin({ user: { userId: "u1", role: "super_admin" } } as any, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden: Super Admin only",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the user has no role", async () => {
    roleInDb(null);
    const res = mockRes();
    const next = jest.fn();

    await requireSuperAdmin({ user: { userId: "u1" } } as any, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the signed-in user no longer exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const res = mockRes();
    const next = jest.fn();

    await requireSuperAdmin({ user: { userId: "gone" } } as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes a database error on to the error handler", async () => {
    const failure = new Error("db down");
    prismaMock.user.findUnique.mockRejectedValue(failure);
    const res = mockRes();
    const next = jest.fn();

    await requireSuperAdmin({ user: { userId: "u1" } } as any, res, next);

    expect(next).toHaveBeenCalledWith(failure);
    expect(res.status).not.toHaveBeenCalled();
  });
});

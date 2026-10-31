import jwt from "jsonwebtoken";
import { prismaMock } from "../helpers/prismaMock";
import { authService, toAccess } from "../../src/services/auth.service";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));

const PHONE = "+911234567891";

/** A Role row as Prisma returns it with its permissions. */
function roleWith(name: string, permissions: string[]) {
  return {
    name,
    permissions: permissions.map((permission) => ({ permission: { name: permission } })),
  };
}

describe("authService.loginWithPhone", () => {
  it("rejects a phone number with no account, and changes nothing", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(authService.loginWithPhone(PHONE)).rejects.toMatchObject({
      status: 404,
      message: "No account is registered for this phone number",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("signs in an existing account and returns its role and permissions", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u2",
      name: "Priya",
      phone: PHONE,
      role: roleWith("admin", ["view_users", "delete_users"]),
    });
    prismaMock.user.update.mockResolvedValue({});

    const result = await authService.loginWithPhone(PHONE);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { phoneVerified: true },
    });
    expect(result.user).toEqual({
      id: "u2",
      name: "Priya",
      phone: PHONE,
      role: "admin",
      permissions: ["delete_users", "view_users"],
    });
  });

  it("puts the role and permissions into the JWT", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u3",
      name: "Super",
      phone: PHONE,
      role: roleWith("super_admin", ["view_users"]),
    });
    prismaMock.user.update.mockResolvedValue({});

    const { token } = await authService.loginWithPhone(PHONE);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: string;
      permissions: string[];
    };

    expect(decoded.userId).toBe("u3");
    expect(decoded.role).toBe("super_admin");
    expect(decoded.permissions).toEqual(["view_users"]);
  });

  it("falls back to the user role with no permissions when the account has no role", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u4",
      name: "Amit",
      phone: PHONE,
      role: null,
    });
    prismaMock.user.update.mockResolvedValue({});

    const result = await authService.loginWithPhone(PHONE);

    expect(result.user).toMatchObject({ role: "user", permissions: [] });
  });
});

describe("toAccess", () => {
  it("returns sorted permission names", () => {
    expect(toAccess(roleWith("admin", ["view_users", "delete_users"]))).toEqual({
      role: "admin",
      permissions: ["delete_users", "view_users"],
    });
  });

  it("defaults to the user role when there is no role row", () => {
    expect(toAccess(null)).toEqual({ role: "user", permissions: [] });
  });
});

describe("authService.login (email) with phone-only accounts", () => {
  it("rejects a phone-only account, which has no password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u5",
      name: "Phone only",
      email: null,
      password: null,
      role: null,
    });

    await expect(
      authService.login("someone@example.com", "anything"),
    ).rejects.toThrow("Invalid email or password");
  });
});

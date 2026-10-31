import jwt from "jsonwebtoken";
import { prismaMock } from "../helpers/prismaMock";
import { authService } from "../../src/services/auth.service";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));

const PHONE = "+919876543210";

describe("authService.loginWithPhone", () => {
  it("creates a Member account on first sign-in and marks it as a new user", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.role.findUnique.mockResolvedValue({
      id: "role-user",
      name: "user",
    });
    prismaMock.user.create.mockResolvedValue({
      id: "u1",
      name: "Member",
      phone: PHONE,
      role: { name: "user" },
    });

    const result = await authService.loginWithPhone(PHONE);

    const created = prismaMock.user.create.mock.calls[0][0].data;
    expect(created).toEqual({
      name: "Member",
      phone: PHONE,
      phoneVerified: true,
      roleId: "role-user",
    });
    expect(result.user).toEqual({
      id: "u1",
      name: "Member",
      phone: PHONE,
      role: "user",
      isNewUser: true,
    });
  });

  it("signs in an existing account without creating a new one", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u2",
      name: "Priya",
      phone: PHONE,
      role: { name: "admin" },
    });
    prismaMock.user.update.mockResolvedValue({});

    const result = await authService.loginWithPhone(PHONE);

    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u2" },
      data: { phoneVerified: true },
    });
    expect(result.user).toEqual({
      id: "u2",
      name: "Priya",
      phone: PHONE,
      role: "admin",
      isNewUser: false,
    });
  });

  it("issues a JWT with the user id and role", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u3",
      name: "Amit",
      phone: PHONE,
      role: null,
    });
    prismaMock.user.update.mockResolvedValue({});

    const { token } = await authService.loginWithPhone(PHONE);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      role: string;
    };

    expect(decoded.userId).toBe("u3");
    expect(decoded.role).toBe("user");
  });
});

describe("authService.login (email) with phone-only accounts", () => {
  it("rejects a phone-only account, which has no password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u4",
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

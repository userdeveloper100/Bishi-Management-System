import request from "supertest";
import jwt from "jsonwebtoken";
import { prismaMock } from "../helpers/prismaMock";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));

// Imported after the mocks so the app picks up the mocked prisma client.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../../src/app").default;

function tokenFor(userId: string) {
  // The token's role claim is stale on purpose. /auth/me must answer from the database.
  return `Bearer ${jwt.sign({ userId, role: "user", permissions: [] }, process.env.JWT_SECRET as string)}`;
}

describe("GET /api/auth/me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 401 when the signed-in account no longer exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/api/auth/me").set("Authorization", tokenFor("gone"));

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Not authenticated");
  });

  it("returns the role and permissions from the database, not from the token", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "s1",
      name: "Super Admin",
      phone: "+911234567892",
      role: {
        name: "super_admin",
        permissions: [{ permission: { name: "view_users" } }],
      },
    });

    const res = await request(app).get("/api/auth/me").set("Authorization", tokenFor("s1"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: "s1",
      name: "Super Admin",
      phone: "+911234567892",
      role: "super_admin",
      permissions: ["view_users"],
    });
  });
});

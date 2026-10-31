import request from "supertest";
import jwt from "jsonwebtoken";
import { prismaMock } from "../helpers/prismaMock";

jest.mock("../../src/prismaClient", () => ({
  prisma: require("../helpers/prismaMock").prismaMock,
}));

// Imported after the mocks so the app picks up the mocked prisma client.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require("../../src/app").default;

/** A token for a user, as login issues it. The role claim is not what the guard trusts. */
function tokenFor(userId: string, role: string) {
  return jwt.sign({ userId, role, permissions: [] }, process.env.JWT_SECRET as string);
}

/** The database role the guard reads on each request. */
function dbRoleIs(name: string) {
  prismaMock.user.findUnique.mockResolvedValue({ role: { name } });
}

describe("/api/users is Super Admin only", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/users");

    expect(res.status).toBe(401);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it.each([["admin"], ["user"]])("returns 403 for a %s on the list", async (role) => {
    dbRoleIs(role);

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${tokenFor("u1", role)}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Forbidden: Super Admin only");
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("returns 403 for an admin on read, create, update and delete", async () => {
    dbRoleIs("admin");
    const auth = `Bearer ${tokenFor("u1", "admin")}`;

    const requests = [
      request(app).get("/api/users/u2").set("Authorization", auth),
      request(app).post("/api/users").set("Authorization", auth).send({ name: "New" }),
      request(app).put("/api/users/u2").set("Authorization", auth).send({ name: "Edited" }),
      request(app).delete("/api/users/u2").set("Authorization", auth),
    ];
    const responses = await Promise.all(requests);

    responses.forEach((res) => expect(res.status).toBe(403));
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("lets a super_admin list the users", async () => {
    dbRoleIs("super_admin");
    prismaMock.user.findMany.mockResolvedValue([{ id: "u1", name: "Admin User" }]);

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${tokenFor("u1", "super_admin")}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "u1", name: "Admin User" }]);
  });
});

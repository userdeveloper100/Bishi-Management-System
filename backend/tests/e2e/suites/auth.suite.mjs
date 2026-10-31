import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { api } from "../helpers/api.mjs";

const PASSWORD = "Passw0rd!";

export function authSuite(ctx) {
  describe("auth", () => {
    const email = `e2e-auth-${Date.now()}@test.local`;

    it("registers a new user", async () => {
      const res = await api("POST", "/api/auth/register", {
        body: { name: "E2E User", email, password: PASSWORD },
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.email, email);
      ctx.user = { id: res.body.id, email };
    });

    it("rejects a duplicate email with 400", async () => {
      const res = await api("POST", "/api/auth/register", {
        body: { name: "Duplicate", email, password: PASSWORD },
      });
      assert.equal(res.status, 400);
    });

    it("logs in and returns a token and user", async () => {
      const res = await api("POST", "/api/auth/login", {
        body: { email, password: PASSWORD },
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      assert.equal(res.body.user.role, "user");
      ctx.user.token = res.body.token;
    });

    it("rejects a wrong password with 401", async () => {
      const res = await api("POST", "/api/auth/login", {
        body: { email, password: "wrong" },
      });
      assert.equal(res.status, 401);
    });

    it("logs in the seeded admin with the admin role", async () => {
      const res = await api("POST", "/api/auth/login", {
        body: { email: "admin@admin.com", password: "admin@123" },
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.user.role, "admin");
    });
  });
}

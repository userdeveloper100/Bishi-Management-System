import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { api } from "../helpers/api.mjs";
import { BASE_URL } from "../helpers/config.mjs";

const RESOURCES = [
  { name: "groups", path: "/api/groups" },
  { name: "bishis", path: "/api/bishis" },
  { name: "transactions", path: "/api/transactions" },
  { name: "messages", path: "/api/messages" },
  { name: "memberships", path: "/api/memberships" },
  { name: "notifications", path: "/api/notifications" },
  { name: "audits", path: "/api/audits" },
];

export function hardeningSuite(ctx) {
  describe("access control", () => {
    for (const { name, path } of RESOURCES) {
      it(`${name}: rejects a request without a token with 401`, async () => {
        const res = await api("GET", path);
        assert.equal(res.status, 401);
      });
    }
  });

  describe("role rules", () => {
    for (const { name, path } of RESOURCES) {
      it(`${name}: non-admins cannot delete with 403`, async () => {
        const res = await api("DELETE", `${path}/${randomUUID()}`, {
          token: ctx.user.token,
        });
        assert.equal(res.status, 403);
      });
    }
  });

  describe("validation", () => {
    for (const { name, path } of RESOURCES) {
      it(`${name}: rejects an empty create body with 400`, async () => {
        const res = await api("POST", path, {
          token: ctx.admin.token,
          body: {},
        });
        assert.equal(res.status, 400, JSON.stringify(res.body));
      });
    }

    it("users: rejects an empty create body with 400", async () => {
      const res = await api("POST", "/api/users", {
        token: ctx.admin.token,
        body: {},
      });
      assert.equal(res.status, 400, JSON.stringify(res.body));
    });

    it("rejects malformed JSON with 400", async () => {
      const res = await fetch(`${BASE_URL}/api/groups`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${ctx.admin.token}`,
        },
        body: "{not json",
      });
      assert.equal(res.status, 400);
    });
  });

  describe("unknown ids", () => {
    for (const { name, path } of RESOURCES) {
      it(`${name}: GET, PUT and DELETE of an unknown id return 404`, async () => {
        const url = `${path}/${randomUUID()}`;
        assert.equal(
          (await api("GET", url, { token: ctx.admin.token })).status,
          404,
          "GET",
        );
        assert.equal(
          (await api("PUT", url, { token: ctx.admin.token, body: {} })).status,
          404,
          "PUT",
        );
        assert.equal(
          (await api("DELETE", url, { token: ctx.admin.token })).status,
          404,
          "DELETE",
        );
      });
    }
  });

  describe("users security", () => {
    const email = `hardening-${Date.now()}@test.local`;
    const password = "Passw0rd!";
    let id;

    it("admin-created user can log in with the password it was given", async () => {
      const created = await api("POST", "/api/users", {
        token: ctx.admin.token,
        body: { name: "Hardening User", email, password },
      });
      assert.equal(created.status, 201);
      id = created.body.id;

      const login = await api("POST", "/api/auth/login", {
        body: { email, password },
      });
      assert.equal(login.status, 200, JSON.stringify(login.body));
    });

    it("user responses never include the password hash", async () => {
      const res = await api("GET", `/api/users/${id}`, {
        token: ctx.admin.token,
      });
      assert.equal(res.status, 200);
      assert.equal("password" in res.body, false);
    });

    it("admin-updated password is hashed and works for login", async () => {
      const updated = await api("PUT", `/api/users/${id}`, {
        token: ctx.admin.token,
        body: { password: "NewPassw0rd!" },
      });
      assert.equal(updated.status, 200);
      assert.equal("password" in updated.body, false);

      const login = await api("POST", "/api/auth/login", {
        body: { email, password: "NewPassw0rd!" },
      });
      assert.equal(login.status, 200);
    });

    it("cleans up the hardening user", async () => {
      const res = await api("DELETE", `/api/users/${id}`, {
        token: ctx.admin.token,
      });
      assert.equal(res.status, 200);
    });
  });
}

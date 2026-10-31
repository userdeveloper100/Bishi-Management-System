import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { api } from "../helpers/api.mjs";

export function usersSuite(ctx) {
    describe("users", () => {
        it("rejects listing users without a token with 401", async () => {
            const res = await api("GET", "/api/users");
            assert.equal(res.status, 401);
        });

        it("lets an authenticated user list users", async () => {
            const res = await api("GET", "/api/users", { token: ctx.user.token });
            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.body));
        });

        it("forbids non-admins from fetching a user by id with 403", async () => {
            const res = await api("GET", `/api/users/${ctx.user.id}`, { token: ctx.user.token });
            assert.equal(res.status, 403);
        });

        it("forbids non-admins from creating users with 403", async () => {
            const res = await api("POST", "/api/users", {
                token: ctx.user.token,
                body: { name: "Not Allowed", email: `denied-${Date.now()}@test.local`, password: "x" },
            });
            assert.equal(res.status, 403);
        });

        describe("admin CRUD", () => {
            const email = `admin-made-${Date.now()}@test.local`;
            let id;

            it("lets an admin fetch a user by id", async () => {
                const res = await api("GET", `/api/users/${ctx.user.id}`, { token: ctx.admin.token });
                assert.equal(res.status, 200);
                assert.equal(res.body.id, ctx.user.id);
            });

            it("lets an admin create a user", async () => {
                const res = await api("POST", "/api/users", {
                    token: ctx.admin.token,
                    body: { name: "Admin Created", email, password: "Passw0rd!" },
                });
                assert.equal(res.status, 201);
                id = res.body.id;
            });

            it("lets an admin update a user", async () => {
                const res = await api("PUT", `/api/users/${id}`, {
                    token: ctx.admin.token,
                    body: { name: "Admin Created Updated" },
                });
                assert.equal(res.status, 200);
                assert.equal(res.body.name, "Admin Created Updated");
            });

            it("lets an admin delete a user", async () => {
                const res = await api("DELETE", `/api/users/${id}`, { token: ctx.admin.token });
                assert.equal(res.status, 200);
            });
        });
    });
}

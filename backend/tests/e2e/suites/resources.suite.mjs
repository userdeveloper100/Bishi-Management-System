import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { api } from "../helpers/api.mjs";

// Full CRUD lifecycle for one resource: create, list, get, update, delete, confirm gone.
function crudSuite(ctx, { name, path, create, update, deleteStatus = 200 }) {
    describe(name, () => {
        let id;

        it("creates", async () => {
            const res = await api("POST", path, { token: ctx.admin.token, body: create() });
            assert.equal(res.status, 201, JSON.stringify(res.body));
            assert.ok(res.body.id);
            id = res.body.id;
        });

        it("lists, including the new record", async () => {
            const res = await api("GET", path, { token: ctx.admin.token });
            assert.equal(res.status, 200);
            assert.ok(res.body.some((item) => item.id === id));
        });

        it("fetches by id", async () => {
            const res = await api("GET", `${path}/${id}`, { token: ctx.admin.token });
            assert.equal(res.status, 200);
            assert.equal(res.body.id, id);
        });

        it("updates", async () => {
            const res = await api("PUT", `${path}/${id}`, { token: ctx.admin.token, body: update });
            assert.equal(res.status, 200, JSON.stringify(res.body));
            assert.equal(res.body.id, id);
        });

        it("deletes", async () => {
            const res = await api("DELETE", `${path}/${id}`, { token: ctx.admin.token });
            assert.equal(res.status, deleteStatus);
        });

        it("returns 404 for the deleted record", async () => {
            const res = await api("GET", `${path}/${id}`, { token: ctx.admin.token });
            assert.equal(res.status, 404);
        });
    });
}

export function resourcesSuite(ctx) {
    describe("resources", () => {
        // Parent records that the dependent resources below reference.
        before(async () => {
            const group = await api("POST", "/api/groups", {
                token: ctx.admin.token,
                body: { name: `E2E fixture group ${Date.now()}` },
            });
            assert.equal(group.status, 201);

            const bishi = await api("POST", "/api/bishis", {
                token: ctx.admin.token,
                body: { title: "E2E fixture bishi", description: "fixture", groupId: group.body.id, ownerId: ctx.admin.id },
            });
            assert.equal(bishi.status, 201);

            ctx.fixtures = { groupId: group.body.id, bishiId: bishi.body.id };
        });

        after(async () => {
            await api("DELETE", `/api/bishis/${ctx.fixtures.bishiId}`, { token: ctx.admin.token });
            await api("DELETE", `/api/groups/${ctx.fixtures.groupId}`, { token: ctx.admin.token });
        });

        crudSuite(ctx, {
            name: "groups",
            path: "/api/groups",
            create: () => ({ name: `E2E group ${Date.now()}` }),
            update: { name: `E2E group updated ${Date.now()}` },
        });

        crudSuite(ctx, {
            name: "bishis",
            path: "/api/bishis",
            create: () => ({ title: "E2E bishi", description: "e2e", groupId: ctx.fixtures.groupId, ownerId: ctx.admin.id }),
            update: { title: "E2E bishi updated", description: "e2e updated" },
        });

        crudSuite(ctx, {
            name: "transactions",
            path: "/api/transactions",
            create: () => ({ amount: 500, bishiId: ctx.fixtures.bishiId, userId: ctx.admin.id }),
            update: { amount: 750 },
        });

        crudSuite(ctx, {
            name: "messages",
            path: "/api/messages",
            create: () => ({ content: "e2e hello", groupId: ctx.fixtures.groupId, userId: ctx.admin.id }),
            update: { content: "e2e hello updated" },
        });

        crudSuite(ctx, {
            name: "memberships",
            path: "/api/memberships",
            create: () => ({ userId: ctx.admin.id, groupId: ctx.fixtures.groupId, role: "member", status: "accepted" }),
            update: { status: "pending" },
        });

        describe("memberships validation", () => {
            it("rejects a create without userId or groupId with 400", async () => {
                const res = await api("POST", "/api/memberships", { token: ctx.admin.token, body: {} });
                assert.equal(res.status, 400);
            });
        });

        crudSuite(ctx, {
            name: "notifications",
            path: "/api/notifications",
            create: () => ({ message: "e2e notification", userId: ctx.admin.id }),
            update: { message: "e2e notification updated" },
        });

        crudSuite(ctx, {
            name: "audits",
            path: "/api/audits",
            create: () => ({ action: "CREATE", entity: "Group", entityId: ctx.fixtures.groupId, performedBy: ctx.admin.id }),
            update: { action: "UPDATE" },
            deleteStatus: 204, // audits return No Content on delete; other resources return 200
        });
    });
}

import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { api } from "./helpers/api.mjs";
import { ADMIN_EMAIL, ADMIN_PASSWORD, EXTERNAL_SERVER } from "./helpers/config.mjs";
import { startServer } from "./helpers/server.mjs";
import { authSuite } from "./suites/auth.suite.mjs";
import { hardeningSuite } from "./suites/hardening.suite.mjs";
import { resourcesSuite } from "./suites/resources.suite.mjs";
import { usersSuite } from "./suites/users.suite.mjs";

// Run with: npm run test:e2e
describe("Bishi API (end to end)", () => {
    // Shared state across suites: the admin login, and the user created by the auth suite.
    const ctx = {};
    let server;

    before(async () => {
        if (!EXTERNAL_SERVER) server = await startServer();

        const login = await api("POST", "/api/auth/login", {
            body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
        });
        assert.equal(login.status, 200, `admin login failed: ${JSON.stringify(login.body)}`);
        ctx.admin = { token: login.body.token, id: login.body.user.id };
    });

    after(async () => {
        if (ctx.user?.id && ctx.admin) {
            await api("DELETE", `/api/users/${ctx.user.id}`, { token: ctx.admin.token });
        }
        await server?.stop();
    });

    it("root health check responds", async () => {
        const res = await api("GET", "/");
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
    });

    authSuite(ctx);
    usersSuite(ctx);
    resourcesSuite(ctx);
    hardeningSuite(ctx);
});

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BASE_URL, PORT } from "./config.mjs";

const require = createRequire(import.meta.url);
const TS_NODE_BIN = require.resolve("ts-node/dist/bin.js");
const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const READY_ATTEMPTS = 60;

/**
 * Start the backend from source on the test port and wait until it answers.
 * Set TEST_DATABASE_URL to point the suite at a database other than the one in .env.
 */
export async function startServer() {
    const env = { ...process.env, PORT };
    if (process.env.TEST_DATABASE_URL) env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    const child = spawn(process.execPath, [TS_NODE_BIN, "--transpile-only", "src/server.ts"], {
        cwd: BACKEND_ROOT,
        env,
        stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));

    await waitUntilReady(child, () => output);

    return {
        stop: () => stopChild(child),
    };
}

async function waitUntilReady(child, getOutput) {
    for (let attempt = 0; attempt < READY_ATTEMPTS; attempt++) {
        if (child.exitCode !== null) {
            throw new Error(`Server exited before becoming ready:\n${getOutput()}`);
        }
        try {
            const res = await fetch(`${BASE_URL}/`);
            if (res.ok) return;
        } catch {
            // Not listening yet.
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    child.kill();
    throw new Error(`Server did not become ready at ${BASE_URL}:\n${getOutput()}`);
}

function stopChild(child) {
    if (child.exitCode !== null) return Promise.resolve();
    return new Promise((resolve) => {
        child.once("exit", resolve);
        child.kill();
    });
}

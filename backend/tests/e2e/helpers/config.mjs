// Test configuration. Override any value with an environment variable.
export const PORT = process.env.TEST_PORT ?? "5055";

// Set API_BASE_URL to run the suite against a server you already started.
export const EXTERNAL_SERVER = Boolean(process.env.API_BASE_URL);
export const BASE_URL = process.env.API_BASE_URL ?? `http://localhost:${PORT}`;

// Seeded admin from prisma/seed.ts.
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@admin.com";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin@123";

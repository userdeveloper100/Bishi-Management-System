/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/tests/unit", "<rootDir>/tests/http"],
    testMatch: ["**/*.test.ts"],
    setupFiles: ["<rootDir>/tests/setupEnv.ts"],
    transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
    },
    // Each test sets its own mock behaviour, so start every test from a clean mock state.
    resetMocks: true,
};

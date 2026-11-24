import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Tests talk to a real Postgres and wipe it between tests, so they refuse to
// run unless TEST_DATABASE_URL points at a disposable database.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("Set TEST_DATABASE_URL to a disposable, migrated database (the tests wipe it).");
}

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
    env: { DATABASE_URL: testDatabaseUrl, NODE_ENV: "test" },
  },
});

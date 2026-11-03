import { defineConfig, devices } from "@playwright/test";
import { getE2eBaseUrl, getE2eDatabaseUrl } from "./e2e/test-database";

const baseURL = getE2eBaseUrl();
const databaseUrl = getE2eDatabaseUrl();
const port = new URL(baseURL).port || "3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: databaseUrl,
      TEST_DATABASE_URL: databaseUrl,
      NEXT_PUBLIC_APP_URL: baseURL,
      RATE_LIMIT_DISABLED: "true",
    },
  },
});

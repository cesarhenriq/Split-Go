import { execSync } from "node:child_process";
import { getE2eDatabaseUrl } from "./test-database";

export default function globalSetup() {
  const testDatabaseUrl = getE2eDatabaseUrl();

  execSync("npm run db:test:prepare", {
    env: {
      ...process.env,
      TEST_DATABASE_URL: testDatabaseUrl,
    },
    stdio: "inherit",
  });
}

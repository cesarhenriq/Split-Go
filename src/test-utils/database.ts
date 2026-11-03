import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { relations } from "@/db/relations";

export function getTestDatabaseUrl() {
  const explicit = process.env.TEST_DATABASE_URL;

  if (explicit) {
    const url = new URL(explicit);

    if (!url.pathname.endsWith("_test")) {
      throw new Error("The test database name must end with _test");
    }

    return explicit;
  }

  const baseUrl = process.env.DATABASE_URL;

  if (!baseUrl) {
    throw new Error("DATABASE_URL is not defined");
  }

  const url = new URL(baseUrl);
  url.pathname = "/splitgo_test";

  return url.toString();
}

export function createTestDatabase() {
  const connectionString = getTestDatabaseUrl();

  return {
    client: new pg.Client({ connectionString }),
    db: drizzle(connectionString, { relations }),
  };
}

export async function resetTestDatabase(client: pg.Client) {
  await client.query(
    `truncate table
       rate_limits,
       sessions,
       settlements,
       expense_splits,
       expenses,
       group_invitations,
       group_members,
       groups,
       users
     restart identity cascade`,
  );
}

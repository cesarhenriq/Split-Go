import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { getDatabaseUrl, getPoolMax } from "@/lib/env";
import { relations } from "./relations";
import * as schema from "./schema";

function createDatabase() {
  const pool = new pg.Pool({
    connectionString: getDatabaseUrl(),
    max: getPoolMax(),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return drizzle({ client: pool, relations });
}

const globalForDatabase = globalThis as unknown as {
  database?: ReturnType<typeof createDatabase>;
};

export const db = globalForDatabase.database ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.database = db;
}

export { schema };
export * from "./schema";
export type Database = typeof db;

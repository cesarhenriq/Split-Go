import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./relations";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const databaseUrl = connectionString;

function createDatabase() {
  return drizzle(databaseUrl, { relations });
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

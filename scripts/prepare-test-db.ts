import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

function resolveTestDatabaseUrl(): URL {
  const explicit = process.env.TEST_DATABASE_URL?.trim();

  if (explicit) {
    return new URL(explicit);
  }

  const baseUrl = process.env.DATABASE_URL?.trim();

  if (!baseUrl) {
    throw new Error("DATABASE_URL or TEST_DATABASE_URL must be defined");
  }

  const testUrl = new URL(baseUrl);
  testUrl.pathname = "/splitgo_test";

  return testUrl;
}

function getDatabaseName(url: URL): string {
  const name = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!/^[A-Za-z_][A-Za-z0-9_]*_test$/.test(name)) {
    throw new Error(
      "The test database name must be a valid identifier ending with _test",
    );
  }

  return name;
}

async function main() {
  const testUrl = resolveTestDatabaseUrl();
  const databaseName = getDatabaseName(testUrl);
  const adminUrl = new URL(testUrl.toString());
  adminUrl.pathname = "/postgres";

  const admin = new pg.Client({ connectionString: adminUrl.toString() });

  await admin.connect();

  try {
    const database = await admin.query(
      "select 1 from pg_database where datname = $1",
      [databaseName],
    );

    if (database.rowCount === 0) {
      await admin.query(`create database "${databaseName}"`);
    }
  } finally {
    await admin.end();
  }

  const client = new pg.Client({ connectionString: testUrl.toString() });

  await client.connect();

  try {
    await client.query("drop schema if exists public cascade");
    await client.query("create schema public");

    const migrationsDirectory = path.resolve("drizzle/migrations");
    const entries = await readdir(migrationsDirectory, { withFileTypes: true });
    const migrationDirectories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const directory of migrationDirectories) {
      const sql = await readFile(
        path.join(migrationsDirectory, directory, "migration.sql"),
        "utf8",
      );
      const statements = sql
        .split("--> statement-breakpoint")
        .map((statement) => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await client.query(statement);
      }
    }

    console.log(`Banco de teste pronto: ${databaseName}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

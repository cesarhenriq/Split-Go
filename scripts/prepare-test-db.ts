import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const baseUrl = process.env.DATABASE_URL;

if (!baseUrl) {
  throw new Error("DATABASE_URL is not defined");
}

const testUrl = new URL(baseUrl);
testUrl.pathname = "/splitgo_test";

if (!testUrl.pathname.endsWith("_test")) {
  throw new Error("The test database name must end with _test");
}

const adminUrl = new URL(baseUrl);
adminUrl.pathname = "/postgres";

async function main() {
  const admin = new pg.Client({ connectionString: adminUrl.toString() });

  await admin.connect();

  try {
    const database = await admin.query(
      "select 1 from pg_database where datname = 'splitgo_test'",
    );

    if (database.rowCount === 0) {
      await admin.query("create database splitgo_test");
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

    console.log(`Banco de teste pronto: ${testUrl.pathname.slice(1)}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

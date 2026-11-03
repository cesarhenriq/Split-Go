import "dotenv/config";

export function getE2eDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL?.trim();

  if (explicit) {
    const url = new URL(explicit);

    if (!url.pathname.endsWith("_test")) {
      throw new Error(
        "TEST_DATABASE_URL must point to a database ending in _test",
      );
    }

    return url.toString();
  }

  const baseUrl = process.env.DATABASE_URL?.trim();

  if (!baseUrl) {
    throw new Error("DATABASE_URL or TEST_DATABASE_URL must be defined");
  }

  const url = new URL(baseUrl);
  url.pathname = "/splitgo_test";

  return url.toString();
}

export function getE2eBaseUrl(): string {
  return (
    process.env.E2E_BASE_URL?.trim() ??
    `http://localhost:${process.env.E2E_PORT ?? "3100"}`
  );
}

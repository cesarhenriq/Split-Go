import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  clearRateLimit,
  consumeRateLimit,
  hashRateLimitKey,
} from "@/lib/security/rate-limit";
import { createTestDatabase, resetTestDatabase } from "@/test-utils/database";

const { client, db } = createTestDatabase();

beforeAll(async () => {
  await client.connect();
});

beforeEach(async () => {
  await resetTestDatabase(client);
});

afterAll(async () => {
  await client.end();
});

describe("consumeRateLimit", () => {
  it("permite até o limite e bloqueia o excedente", async () => {
    const now = new Date("2026-10-01T12:00:00.000Z");
    const key = hashRateLimitKey("test", "alice@example.com");

    const first = await consumeRateLimit(
      { key, limit: 2, windowMs: 60_000, now },
      db,
    );
    const second = await consumeRateLimit(
      { key, limit: 2, windowMs: 60_000, now },
      db,
    );
    const third = await consumeRateLimit(
      { key, limit: 2, windowMs: 60_000, now },
      db,
    );

    expect(first).toMatchObject({ allowed: true, remaining: 1 });
    expect(second).toMatchObject({ allowed: true, remaining: 0 });
    expect(third).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("reinicia a contagem após a janela", async () => {
    const now = new Date("2026-10-01T12:00:00.000Z");
    const key = hashRateLimitKey("test", "window@example.com");

    await consumeRateLimit({ key, limit: 1, windowMs: 60_000, now }, db);
    const blocked = await consumeRateLimit(
      { key, limit: 1, windowMs: 60_000, now },
      db,
    );
    const afterWindow = await consumeRateLimit(
      {
        key,
        limit: 1,
        windowMs: 60_000,
        now: new Date(now.getTime() + 60_001),
      },
      db,
    );

    expect(blocked.allowed).toBe(false);
    expect(afterWindow.allowed).toBe(true);
  });

  it("limpa uma chave", async () => {
    const key = hashRateLimitKey("test", "clear@example.com");

    await consumeRateLimit({ key, limit: 0, windowMs: 60_000 }, db);
    await clearRateLimit(key, db);

    const result = await consumeRateLimit(
      { key, limit: 1, windowMs: 60_000 },
      db,
    );

    expect(result.allowed).toBe(true);
  });
});

describe("hashRateLimitKey", () => {
  it("não expõe o identificador original", () => {
    const key = hashRateLimitKey("login", "secret@example.com");

    expect(key.startsWith("login:")).toBe(true);
    expect(key).not.toContain("secret@example.com");
  });
});

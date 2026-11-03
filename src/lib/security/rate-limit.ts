import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import type { Database } from "@/db/types";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
};

export type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
  now?: Date;
};

export function hashRateLimitKey(scope: string, identifier: string): string {
  const hash = createHash("sha256").update(identifier).digest("hex");
  return `${scope}:${hash}`;
}

export async function consumeRateLimit(
  input: RateLimitInput,
  database: Database = db,
): Promise<RateLimitResult> {
  const now = input.now ?? new Date();
  const resetAt = new Date(now.getTime() + input.windowMs);

  const [row] = await database
    .insert(rateLimits)
    .values({
      key: input.key,
      count: 1,
      resetAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= ${now} then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= ${now} then ${resetAt} else ${rateLimits.resetAt} end`,
        updatedAt: now,
      },
    })
    .returning({
      count: rateLimits.count,
      resetAt: rateLimits.resetAt,
    });

  return {
    allowed: row.count <= input.limit,
    limit: input.limit,
    remaining: Math.max(0, input.limit - row.count),
    resetAt: row.resetAt,
  };
}

export async function clearRateLimit(
  key: string,
  database: Database = db,
): Promise<void> {
  await database.delete(rateLimits).where(eq(rateLimits.key, key));
}

import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import type { Database, DatabaseTransaction } from "@/db/types";
import { SESSION_TTL_MS } from "./constants";
import type { CurrentUser } from "./types";

export type CreatedSession = {
  token: string;
  expiresAt: Date;
};

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  tx: DatabaseTransaction,
  userId: string,
): Promise<CreatedSession> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const now = new Date();

  await tx
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, now)));

  await tx.insert(sessions).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });

  return { token, expiresAt };
}

export async function createSessionForUser(
  userId: string,
  database: Database = db,
): Promise<CreatedSession> {
  return database.transaction((tx) => createSession(tx, userId));
}

export async function findUserBySessionToken(
  token: string,
  database: Database = db,
): Promise<CurrentUser | null> {
  const [result] = await database
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!result) {
    return null;
  }

  return {
    id: result.id,
    name: result.name,
    email: result.email,
    createdAt: result.createdAt.toISOString(),
  };
}

export async function deleteSessionByToken(
  token: string,
  database: Database = db,
): Promise<void> {
  await database
    .delete(sessions)
    .where(eq(sessions.tokenHash, hashSessionToken(token)));
}

export async function deleteSessionsByUserId(
  userId: string,
  database: Database = db,
): Promise<void> {
  await database.delete(sessions).where(eq(sessions.userId, userId));
}

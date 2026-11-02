import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { sessions, users } from "@/db/schema";
import {
  createSessionForUser,
  deleteSessionByToken,
  deleteSessionsByUserId,
  findUserBySessionToken,
  generateSessionToken,
  hashSessionToken,
} from "@/lib/auth/session";
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

async function createUser(email = "alice@example.com") {
  const [user] = await db
    .insert(users)
    .values({
      name: "Alice",
      email,
      passwordHash: "hash",
    })
    .returning({ id: users.id });

  return user;
}

describe("sessions", () => {
  it("cria sessão e recupera o usuário pelo token", async () => {
    const user = await createUser();
    const session = await createSessionForUser(user.id, db);
    const currentUser = await findUserBySessionToken(session.token, db);

    expect(currentUser).toMatchObject({
      id: user.id,
      name: "Alice",
      email: "alice@example.com",
    });
    expect(currentUser?.createdAt).toEqual(expect.any(String));
  });

  it("armazena apenas o hash do token", async () => {
    const user = await createUser();
    const session = await createSessionForUser(user.id, db);
    const stored = await client.query(
      "select token_hash from sessions where user_id = $1",
      [user.id],
    );

    expect(stored.rows[0].token_hash).toBe(hashSessionToken(session.token));
    expect(stored.rows[0].token_hash).not.toBe(session.token);
  });

  it("rejeita token inexistente", async () => {
    const user = await createUser();
    await createSessionForUser(user.id, db);

    expect(await findUserBySessionToken(generateSessionToken(), db)).toBeNull();
  });

  it("rejeita sessão expirada", async () => {
    const user = await createUser();
    const token = generateSessionToken();
    const past = new Date(Date.now() - 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(past.getTime() + 1000),
      createdAt: past,
      updatedAt: past,
    });

    expect(await findUserBySessionToken(token, db)).toBeNull();
  });

  it("logout invalida a sessão", async () => {
    const user = await createUser();
    const session = await createSessionForUser(user.id, db);

    await deleteSessionByToken(session.token, db);

    expect(await findUserBySessionToken(session.token, db)).toBeNull();
  });

  it("remove todas as sessões de um usuário", async () => {
    const user = await createUser();
    const firstSession = await createSessionForUser(user.id, db);
    const secondSession = await createSessionForUser(user.id, db);

    await deleteSessionsByUserId(user.id, db);

    expect(await findUserBySessionToken(firstSession.token, db)).toBeNull();
    expect(await findUserBySessionToken(secondSession.token, db)).toBeNull();
  });
});

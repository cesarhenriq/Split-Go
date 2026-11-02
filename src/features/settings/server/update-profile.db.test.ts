import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { users } from "@/db/schema";
import { isPostgresUniqueViolation } from "@/lib/db/errors";
import { createTestDatabase, resetTestDatabase } from "@/test-utils/database";
import { updateUserProfile } from "./update-profile";

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

async function createUser(name: string, email: string) {
  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: "hash",
    })
    .returning({ id: users.id });

  return user;
}

describe("updateUserProfile", () => {
  it("atualiza nome e e-mail", async () => {
    const user = await createUser("Alice", "alice@example.com");

    const updated = await updateUserProfile(
      user.id,
      {
        name: "Alice Silva",
        email: "alice.silva@example.com",
      },
      db,
    );

    expect(updated).toMatchObject({
      name: "Alice Silva",
      email: "alice.silva@example.com",
    });
  });

  it("impede e-mail já usado por outra conta", async () => {
    await createUser("Alice", "alice@example.com");
    const bob = await createUser("Bob", "bob@example.com");

    try {
      await updateUserProfile(
        bob.id,
        {
          name: "Bob",
          email: "alice@example.com",
        },
        db,
      );
      throw new Error("A atualização deveria ter falhado.");
    } catch (error) {
      expect(isPostgresUniqueViolation(error, "users_email_unique")).toBe(true);
    }
  });
});

import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { groupMembers, groups, users } from "@/db/schema";
import {
  assertActiveGroupMember,
  assertActiveGroupMembers,
  type DatabaseTransaction,
  type GroupAccessError,
} from "@/features/groups/server/group-access";
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

async function seed(tx: DatabaseTransaction) {
  const [alice] = await tx
    .insert(users)
    .values({
      name: "Alice",
      email: "alice@example.com",
      passwordHash: "hash",
    })
    .returning({ id: users.id });

  const [bob] = await tx
    .insert(users)
    .values({
      name: "Bob",
      email: "bob@example.com",
      passwordHash: "hash",
    })
    .returning({ id: users.id });

  const [carol] = await tx
    .insert(users)
    .values({
      name: "Carol",
      email: "carol@example.com",
      passwordHash: "hash",
    })
    .returning({ id: users.id });

  const [group] = await tx
    .insert(groups)
    .values({
      name: "Trip",
      createdBy: alice.id,
    })
    .returning({ id: groups.id });

  await tx.insert(groupMembers).values([
    {
      groupId: group.id,
      userId: alice.id,
      role: "ADMIN",
      status: "ACCEPTED",
      joinedAt: new Date(),
    },
    {
      groupId: group.id,
      userId: bob.id,
      role: "MEMBER",
      status: "ACCEPTED",
      joinedAt: new Date(),
    },
    {
      groupId: group.id,
      userId: carol.id,
      role: "MEMBER",
      status: "PENDING",
    },
  ]);

  return {
    groupId: group.id,
    aliceId: alice.id,
    bobId: bob.id,
    carolId: carol.id,
  };
}

describe("group access", () => {
  it("aceita membros ativos", async () => {
    await db.transaction(async (tx) => {
      const data = await seed(tx);

      await expect(
        assertActiveGroupMembers(tx, data.groupId, [data.aliceId, data.bobId]),
      ).resolves.toBeUndefined();
    });
  });

  it("rejeita membership pendente", async () => {
    await db.transaction(async (tx) => {
      const data = await seed(tx);

      await expect(
        assertActiveGroupMember(tx, data.groupId, data.carolId),
      ).rejects.toMatchObject<Partial<GroupAccessError>>({
        code: "MEMBERSHIP_NOT_ACTIVE",
        userIds: [data.carolId],
      });
    });
  });

  it("rejeita membro que saiu do grupo", async () => {
    await db.transaction(async (tx) => {
      const data = await seed(tx);

      await tx
        .update(groupMembers)
        .set({ leftAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(groupMembers.groupId, data.groupId),
            eq(groupMembers.userId, data.aliceId),
          ),
        );

      await expect(
        assertActiveGroupMember(tx, data.groupId, data.aliceId),
      ).rejects.toMatchObject({ code: "MEMBERSHIP_NOT_ACTIVE" });
    });
  });

  it("rejeita lista vazia", async () => {
    await db.transaction(async (tx) => {
      const data = await seed(tx);

      await expect(
        assertActiveGroupMembers(tx, data.groupId, []),
      ).rejects.toMatchObject({ code: "EMPTY_PARTICIPANT_LIST" });
    });
  });
});

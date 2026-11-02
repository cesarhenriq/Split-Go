import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  expenseSplits,
  expenses,
  groupMembers,
  groups,
  users,
} from "@/db/schema";
import type { DatabaseTransaction } from "@/features/groups/server/group-access";
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

  const [group] = await tx
    .insert(groups)
    .values({ name: "Trip", createdBy: alice.id })
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
  ]);

  return { groupId: group.id, aliceId: alice.id, bobId: bob.id };
}

async function insertExpense(
  tx: DatabaseTransaction,
  data: Awaited<ReturnType<typeof seed>>,
  totalAmount: bigint,
) {
  const [expense] = await tx
    .insert(expenses)
    .values({
      groupId: data.groupId,
      paidBy: data.aliceId,
      description: "Dinner",
      totalAmount,
      expenseDate: new Date("2026-01-01"),
    })
    .returning({ id: expenses.id });

  return expense.id;
}

async function expectTransactionFailure(
  promise: Promise<unknown>,
  expectedMessage: string,
) {
  try {
    await promise;
    throw new Error("A transação deveria ter falhado.");
  } catch (error) {
    const cause =
      error instanceof Error && "cause" in error
        ? (error.cause as { message?: string } | undefined)
        : undefined;
    const message = [
      error instanceof Error ? error.message : "",
      cause?.message ?? "",
    ].join(" ");

    expect(message).toContain(expectedMessage);
  }
}

describe("expense split integrity trigger", () => {
  it("aceita parcelas que somam o total", async () => {
    await db.transaction(async (tx) => {
      const data = await seed(tx);
      const expenseId = await insertExpense(tx, data, 100n);

      await tx.insert(expenseSplits).values([
        { expenseId, userId: data.aliceId, shareAmount: 50n },
        { expenseId, userId: data.bobId, shareAmount: 50n },
      ]);
    });
  });

  it("rejeita parcelas cuja soma é diferente do total", async () => {
    await expectTransactionFailure(
      db.transaction(async (tx) => {
        const data = await seed(tx);
        const expenseId = await insertExpense(tx, data, 100n);

        await tx.insert(expenseSplits).values([
          { expenseId, userId: data.aliceId, shareAmount: 60n },
          { expenseId, userId: data.bobId, shareAmount: 30n },
        ]);
      }),
      "does not match total_amount",
    );
  });

  it("rejeita percentuais que não somam 100", async () => {
    await expectTransactionFailure(
      db.transaction(async (tx) => {
        const data = await seed(tx);
        const [expense] = await tx
          .insert(expenses)
          .values({
            groupId: data.groupId,
            paidBy: data.aliceId,
            description: "Dinner",
            totalAmount: 100n,
            splitMethod: "PERCENTAGE",
            expenseDate: new Date("2026-01-01"),
          })
          .returning({ id: expenses.id });

        await tx.insert(expenseSplits).values([
          {
            expenseId: expense.id,
            userId: data.aliceId,
            shareAmount: 50n,
            percentage: 50,
          },
          {
            expenseId: expense.id,
            userId: data.bobId,
            shareAmount: 50n,
            percentage: 40,
          },
        ]);
      }),
      "percentages sum to",
    );
  });
});

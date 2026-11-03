import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { groupMembers, settlements } from "@/db/schema";
import { getGroupBalancesForUser } from "@/features/balances/server/queries";
import { cancelExpense } from "@/features/expenses/server/cancel-expense";
import { createExpense } from "@/features/expenses/server/create-expense";
import { applySettlementSuggestions } from "@/lib/finance/calculate-balances";
import {
  addAcceptedMember,
  createGroupWithAdmin,
  createTestDatabase,
  createTestUser,
  resetTestDatabase,
} from "@/test-utils/fixtures";

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

type Setup = {
  groupId: string;
  aliceId: string;
  bobId: string;
  carolId: string;
  daveId: string;
  eveId: string;
};

async function setup(): Promise<Setup> {
  const aliceId = await createTestUser(db, {
    name: "Alice",
    email: "alice@example.com",
  });
  const bobId = await createTestUser(db, {
    name: "Bob",
    email: "bob@example.com",
  });
  const carolId = await createTestUser(db, {
    name: "Carol",
    email: "carol@example.com",
  });
  const daveId = await createTestUser(db, {
    name: "Dave",
    email: "dave@example.com",
  });
  const eveId = await createTestUser(db, {
    name: "Eve",
    email: "eve@example.com",
  });
  const groupId = await createGroupWithAdmin(db, aliceId);
  await addAcceptedMember(db, groupId, bobId);
  await addAcceptedMember(db, groupId, carolId);
  await addAcceptedMember(db, groupId, eveId);

  return { groupId, aliceId, bobId, carolId, daveId, eveId };
}

async function createTestExpense(
  data: Setup,
  input: {
    paidBy?: string;
    totalAmount?: bigint;
    participantIds?: string[];
    description?: string;
  } = {},
) {
  return createExpense(
    {
      groupId: data.groupId,
      actorId: data.aliceId,
      paidBy: input.paidBy ?? data.aliceId,
      description: input.description ?? "Despesa",
      totalAmount: input.totalAmount ?? 30000n,
      expenseDate: new Date("2026-11-02T12:00:00.000Z"),
      split: {
        method: "EQUAL",
        participantIds: input.participantIds ?? [
          data.aliceId,
          data.bobId,
          data.carolId,
        ],
      },
    },
    db,
  );
}

describe("getGroupBalancesForUser", () => {
  it("calcula saldos, resumo e transferências", async () => {
    const data = await setup();
    await createTestExpense(data);

    const view = await getGroupBalancesForUser(data.groupId, data.aliceId, db);

    expect(view).not.toBeNull();
    expect(view?.totalExpenses).toBe(30000n);
    expect(view?.totalPaid).toBe(30000n);
    expect(view?.totalOwed).toBe(30000n);
    expect(view?.totalToReceive).toBe(20000n);
    expect(view?.totalToPay).toBe(20000n);
    expect(view?.creditorsCount).toBe(1);
    expect(view?.debtorsCount).toBe(2);
    expect(view?.suggestions).toHaveLength(2);
    expect(
      view?.members.find((member) => member.userId === data.eveId)?.balance,
    ).toBe(0n);

    if (view) {
      const working = applySettlementSuggestions(
        view.members,
        view.suggestions,
      );
      expect([...working.values()].every((value) => value === 0n)).toBe(true);
    }
  });

  it("considera pagador fora do rateio", async () => {
    const data = await setup();
    await createTestExpense(data, {
      paidBy: data.aliceId,
      participantIds: [data.bobId, data.carolId],
      totalAmount: 20000n,
    });

    const view = await getGroupBalancesForUser(data.groupId, data.aliceId, db);

    expect(
      view?.members.find((member) => member.userId === data.aliceId)?.balance,
    ).toBe(20000n);
    expect(
      view?.members.find((member) => member.userId === data.bobId)?.balance,
    ).toBe(-10000n);
  });

  it("ignora despesas canceladas", async () => {
    const data = await setup();
    const expense = await createTestExpense(data);
    await cancelExpense(data.groupId, expense.id, data.aliceId, db);

    const view = await getGroupBalancesForUser(data.groupId, data.aliceId, db);

    expect(view?.totalExpenses).toBe(0n);
    expect(view?.suggestions).toEqual([]);
    expect(view?.members.every((member) => member.balance === 0n)).toBe(true);
  });

  it("inclui ex-integrante referenciado nas despesas", async () => {
    const data = await setup();
    const frankId = await createTestUser(db, {
      name: "Frank",
      email: "frank@example.com",
    });
    await addAcceptedMember(db, data.groupId, frankId);
    await createTestExpense(data, {
      paidBy: frankId,
      participantIds: [data.aliceId, frankId],
      totalAmount: 10000n,
    });
    await db
      .update(groupMembers)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(groupMembers.groupId, data.groupId),
          eq(groupMembers.userId, frankId),
        ),
      );

    const view = await getGroupBalancesForUser(data.groupId, data.aliceId, db);
    const frank = view?.members.find((member) => member.userId === frankId);

    expect(frank?.isActiveMember).toBe(false);
  });

  it("impede acesso de usuário fora do grupo", async () => {
    const data = await setup();

    expect(
      await getGroupBalancesForUser(data.groupId, data.daveId, db),
    ).toBeNull();
  });

  it("não grava transferências sugeridas em settlements", async () => {
    const data = await setup();
    await createTestExpense(data);
    await getGroupBalancesForUser(data.groupId, data.aliceId, db);

    expect(await db.select().from(settlements)).toHaveLength(0);
  });
});

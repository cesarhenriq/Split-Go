import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { expenseSplits, expenses } from "@/db/schema";
import { cancelExpense } from "@/features/expenses/server/cancel-expense";
import { createExpense } from "@/features/expenses/server/create-expense";
import type { ExpenseDomainError } from "@/features/expenses/server/expense-access";
import {
  getExpenseDetailForUser,
  getExpenseFormContext,
  listGroupExpenses,
} from "@/features/expenses/server/queries";
import { updateExpense } from "@/features/expenses/server/update-expense";
import { GroupAccessError } from "@/features/groups/server/group-access";
import type { ExpenseFilters } from "@/lib/validation/expenses";
import { expenseFiltersSchema } from "@/lib/validation/expenses";
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
  const groupId = await createGroupWithAdmin(db, aliceId);
  await addAcceptedMember(db, groupId, bobId);
  await addAcceptedMember(db, groupId, carolId);

  return { groupId, aliceId, bobId, carolId, daveId };
}

function defaultFilters(
  overrides: Partial<ExpenseFilters> = {},
): ExpenseFilters {
  return expenseFiltersSchema.parse({
    description: "",
    from: "",
    to: "",
    paidBy: "",
    includeCancelled: false,
    page: 1,
    ...overrides,
  });
}

async function getSplits(expenseId: string) {
  return db
    .select()
    .from(expenseSplits)
    .where(eq(expenseSplits.expenseId, expenseId));
}

describe("expense creation", () => {
  it("cria despesa igualitária com soma exata e createdBy", async () => {
    const data = await setup();

    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.aliceId,
        description: "Supermercado",
        totalAmount: 10000n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: {
          method: "EQUAL",
          participantIds: [data.aliceId, data.bobId, data.carolId],
        },
      },
      db,
    );

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, created.id));
    const splits = await getSplits(created.id);

    expect(expense.createdBy).toBe(data.aliceId);
    expect(expense.totalAmount).toBe(10000n);
    expect(splits).toHaveLength(3);
    expect(splits.reduce((total, split) => total + split.shareAmount, 0n)).toBe(
      10000n,
    );
    expect(splits.map((split) => split.shareAmount).sort()).toEqual([
      3333n,
      3333n,
      3334n,
    ]);
  });

  it("permite despesa de 1 centavo com parcelas zero", async () => {
    const data = await setup();

    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.aliceId,
        description: "Centavo",
        totalAmount: 1n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: {
          method: "EQUAL",
          participantIds: [data.aliceId, data.bobId, data.carolId],
        },
      },
      db,
    );

    const splits = await getSplits(created.id);

    expect(splits).toHaveLength(3);
    expect(splits.reduce((total, split) => total + split.shareAmount, 0n)).toBe(
      1n,
    );
    expect(splits.some((split) => split.shareAmount === 0n)).toBe(true);
  });

  it("permite pagador fora do rateio", async () => {
    const data = await setup();

    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.aliceId,
        description: "Presente",
        totalAmount: 3000n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: {
          method: "EQUAL",
          participantIds: [data.bobId, data.carolId],
        },
      },
      db,
    );

    const splits = await getSplits(created.id);

    expect(splits).toHaveLength(2);
    expect(splits.some((split) => split.userId === data.aliceId)).toBe(false);
  });

  it("cria despesa percentual com percentuais persistidos", async () => {
    const data = await setup();

    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.bobId,
        description: "Jantar",
        totalAmount: 20000n,
        expenseDate: new Date("2026-11-03T12:00:00.000Z"),
        split: {
          method: "PERCENTAGE",
          participants: [
            { userId: data.aliceId, basisPoints: 5000 },
            { userId: data.bobId, basisPoints: 3000 },
            { userId: data.carolId, basisPoints: 2000 },
          ],
        },
      },
      db,
    );

    const splits = await getSplits(created.id);
    const byUser = new Map(splits.map((split) => [split.userId, split]));

    expect(byUser.get(data.aliceId)?.shareAmount).toBe(10000n);
    expect(byUser.get(data.bobId)?.shareAmount).toBe(6000n);
    expect(byUser.get(data.carolId)?.shareAmount).toBe(4000n);
    expect(byUser.get(data.aliceId)?.percentage).toBe(50);
  });

  it("cria despesa com valores fixos", async () => {
    const data = await setup();

    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.aliceId,
        description: "Hospedagem",
        totalAmount: 30000n,
        expenseDate: new Date("2026-11-04T12:00:00.000Z"),
        split: {
          method: "FIXED",
          participants: [
            { userId: data.aliceId, amount: 10000n },
            { userId: data.bobId, amount: 15000n },
            { userId: data.carolId, amount: 5000n },
          ],
        },
      },
      db,
    );

    const splits = await getSplits(created.id);

    expect(splits.reduce((total, split) => total + split.shareAmount, 0n)).toBe(
      30000n,
    );
    expect(splits.every((split) => split.percentage === null)).toBe(true);
  });

  it("rejeita usuário fora do grupo", async () => {
    const data = await setup();

    await expect(
      createExpense(
        {
          groupId: data.groupId,
          actorId: data.daveId,
          paidBy: data.aliceId,
          description: "Tentativa",
          totalAmount: 1000n,
          expenseDate: new Date("2026-11-02T12:00:00.000Z"),
          split: { method: "EQUAL", participantIds: [data.aliceId] },
        },
        db,
      ),
    ).rejects.toBeInstanceOf(GroupAccessError);
  });

  it("rejeita pagador fora do grupo", async () => {
    const data = await setup();

    await expect(
      createExpense(
        {
          groupId: data.groupId,
          actorId: data.aliceId,
          paidBy: data.daveId,
          description: "Tentativa",
          totalAmount: 1000n,
          expenseDate: new Date("2026-11-02T12:00:00.000Z"),
          split: { method: "EQUAL", participantIds: [data.aliceId] },
        },
        db,
      ),
    ).rejects.toBeInstanceOf(GroupAccessError);
  });

  it("rejeita participante fora do grupo", async () => {
    const data = await setup();

    await expect(
      createExpense(
        {
          groupId: data.groupId,
          actorId: data.aliceId,
          paidBy: data.aliceId,
          description: "Tentativa",
          totalAmount: 1000n,
          expenseDate: new Date("2026-11-02T12:00:00.000Z"),
          split: {
            method: "EQUAL",
            participantIds: [data.aliceId, data.daveId],
          },
        },
        db,
      ),
    ).rejects.toBeInstanceOf(GroupAccessError);
  });
});

describe("expense update", () => {
  it("recria todos os splits ao editar", async () => {
    const data = await setup();
    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.bobId,
        paidBy: data.bobId,
        description: "Original",
        totalAmount: 10000n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: {
          method: "EQUAL",
          participantIds: [data.bobId, data.carolId],
        },
      },
      db,
    );

    await updateExpense(
      {
        expenseId: created.id,
        groupId: data.groupId,
        actorId: data.bobId,
        paidBy: data.aliceId,
        description: "Atualizada",
        totalAmount: 3000n,
        expenseDate: new Date("2026-11-05T12:00:00.000Z"),
        split: {
          method: "FIXED",
          participants: [
            { userId: data.aliceId, amount: 1000n },
            { userId: data.bobId, amount: 1000n },
            { userId: data.carolId, amount: 1000n },
          ],
        },
      },
      db,
    );

    const splits = await getSplits(created.id);
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, created.id));

    expect(splits).toHaveLength(3);
    expect(splits.reduce((total, split) => total + split.shareAmount, 0n)).toBe(
      3000n,
    );
    expect(expense.description).toBe("Atualizada");
    expect(expense.paidBy).toBe(data.aliceId);
  });

  it("permite edição por administrador", async () => {
    const data = await setup();
    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.bobId,
        paidBy: data.bobId,
        description: "Do Bob",
        totalAmount: 1000n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: { method: "EQUAL", participantIds: [data.bobId] },
      },
      db,
    );

    await updateExpense(
      {
        expenseId: created.id,
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.bobId,
        description: "Editada pela admin",
        totalAmount: 1000n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: { method: "EQUAL", participantIds: [data.bobId] },
      },
      db,
    );

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, created.id));
    expect(expense.description).toBe("Editada pela admin");
  });

  it("impede edição por membro que não criou", async () => {
    const data = await setup();
    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.bobId,
        paidBy: data.bobId,
        description: "Do Bob",
        totalAmount: 1000n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: { method: "EQUAL", participantIds: [data.bobId] },
      },
      db,
    );

    await expect(
      updateExpense(
        {
          expenseId: created.id,
          groupId: data.groupId,
          actorId: data.carolId,
          paidBy: data.bobId,
          description: "Tentativa",
          totalAmount: 1000n,
          expenseDate: new Date("2026-11-02T12:00:00.000Z"),
          split: { method: "EQUAL", participantIds: [data.bobId] },
        },
        db,
      ),
    ).rejects.toMatchObject<Partial<ExpenseDomainError>>({
      code: "EXPENSE_FORBIDDEN",
    });
  });
});

describe("expense cancellation", () => {
  it("cancela sem apagar splits e oculta da listagem padrão", async () => {
    const data = await setup();
    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.bobId,
        paidBy: data.bobId,
        description: "Cancelável",
        totalAmount: 1000n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: { method: "EQUAL", participantIds: [data.bobId] },
      },
      db,
    );

    await cancelExpense(data.groupId, created.id, data.bobId, db);

    const splits = await getSplits(created.id);
    const active = await listGroupExpenses(
      data.groupId,
      data.aliceId,
      defaultFilters(),
      db,
    );
    const all = await listGroupExpenses(
      data.groupId,
      data.aliceId,
      defaultFilters({ includeCancelled: true }),
      db,
    );
    const detail = await getExpenseDetailForUser(
      data.groupId,
      created.id,
      data.aliceId,
      db,
    );

    expect(splits).toHaveLength(1);
    expect(active?.total).toBe(0);
    expect(all?.total).toBe(1);
    expect(detail?.cancelledAt).toEqual(expect.any(String));
    expect(detail?.cancelledByName).toBe("Bob");
    expect(detail?.canEdit).toBe(false);
  });

  it("impede cancelamento por membro que não criou", async () => {
    const data = await setup();
    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.bobId,
        paidBy: data.bobId,
        description: "Do Bob",
        totalAmount: 1000n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: { method: "EQUAL", participantIds: [data.bobId] },
      },
      db,
    );

    await expect(
      cancelExpense(data.groupId, created.id, data.carolId, db),
    ).rejects.toMatchObject<Partial<ExpenseDomainError>>({
      code: "EXPENSE_FORBIDDEN",
    });
  });
});

describe("expense queries and filters", () => {
  it("filtra por descrição, período e pagador", async () => {
    const data = await setup();
    await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.aliceId,
        description: "Mercado",
        totalAmount: 1000n,
        expenseDate: new Date("2026-11-01T12:00:00.000Z"),
        split: { method: "EQUAL", participantIds: [data.aliceId] },
      },
      db,
    );
    await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.bobId,
        description: "Restaurante",
        totalAmount: 2000n,
        expenseDate: new Date("2026-11-10T12:00:00.000Z"),
        split: { method: "EQUAL", participantIds: [data.bobId] },
      },
      db,
    );

    const byDescription = await listGroupExpenses(
      data.groupId,
      data.aliceId,
      defaultFilters({ description: "resta" }),
      db,
    );
    const byDate = await listGroupExpenses(
      data.groupId,
      data.aliceId,
      defaultFilters({ from: "2026-11-05", to: "2026-11-15" }),
      db,
    );
    const byPayer = await listGroupExpenses(
      data.groupId,
      data.aliceId,
      defaultFilters({ paidBy: data.bobId }),
      db,
    );

    expect(byDescription?.items).toHaveLength(1);
    expect(byDescription?.items[0].description).toBe("Restaurante");
    expect(byDate?.items).toHaveLength(1);
    expect(byPayer?.items).toHaveLength(1);
    expect(byPayer?.items[0].paidByName).toBe("Bob");
  });

  it("impede acesso de terceiros à listagem e ao detalhe", async () => {
    const data = await setup();
    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.aliceId,
        description: "Privada",
        totalAmount: 1000n,
        expenseDate: new Date("2026-11-02T12:00:00.000Z"),
        split: { method: "EQUAL", participantIds: [data.aliceId] },
      },
      db,
    );

    expect(
      await listGroupExpenses(data.groupId, data.daveId, defaultFilters(), db),
    ).toBeNull();
    expect(
      await getExpenseFormContext(data.groupId, data.daveId, db),
    ).toBeNull();
    expect(
      await getExpenseDetailForUser(data.groupId, created.id, data.daveId, db),
    ).toBeNull();
  });
});

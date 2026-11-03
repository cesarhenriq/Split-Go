import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { settlements } from "@/db/schema";
import { getGroupBalancesForUser } from "@/features/balances/server/queries";
import { cancelExpense } from "@/features/expenses/server/cancel-expense";
import { createExpense } from "@/features/expenses/server/create-expense";
import { updateExpense } from "@/features/expenses/server/update-expense";
import { GroupAccessError } from "@/features/groups/server/group-access";
import { cancelSettlement } from "@/features/settlements/server/cancel-settlement";
import { confirmSettlement } from "@/features/settlements/server/confirm-settlement";
import { createSettlement } from "@/features/settlements/server/create-settlement";
import type { SettlementDomainError } from "@/features/settlements/server/errors";
import {
  getFinancialDashboardForUser,
  getIndividualStatement,
  getSettlementDetailForUser,
  getSettlementFormContext,
  listSettlementsForGroup,
} from "@/features/settlements/server/queries";
import {
  type StatementFilters,
  statementFiltersSchema,
} from "@/lib/validation/settlements";
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

const PAST_DATE = new Date("2026-10-01T00:00:00.000Z");
const EXPENSE_DATE = new Date("2026-10-01T12:00:00.000Z");

type Setup = {
  groupId: string;
  aliceId: string;
  brunoId: string;
  carlaId: string;
  outsiderId: string;
};

async function setup(): Promise<Setup> {
  const aliceId = await createTestUser(db, {
    name: "Alice",
    email: "alice@example.com",
  });
  const brunoId = await createTestUser(db, {
    name: "Bruno",
    email: "bruno@example.com",
  });
  const carlaId = await createTestUser(db, {
    name: "Carla",
    email: "carla@example.com",
  });
  const outsiderId = await createTestUser(db, {
    name: "Diego",
    email: "diego@example.com",
  });
  const groupId = await createGroupWithAdmin(db, aliceId);
  await addAcceptedMember(db, groupId, brunoId);
  await addAcceptedMember(db, groupId, carlaId);

  return { groupId, aliceId, brunoId, carlaId, outsiderId };
}

async function createBaseExpense(data: Setup) {
  return createExpense(
    {
      groupId: data.groupId,
      actorId: data.aliceId,
      paidBy: data.carlaId,
      description: "Despesa base",
      totalAmount: 30000n,
      expenseDate: EXPENSE_DATE,
      split: {
        method: "EQUAL",
        participantIds: [data.aliceId, data.brunoId, data.carlaId],
      },
    },
    db,
  );
}

async function createPayment(
  data: Setup,
  overrides: Partial<Parameters<typeof createSettlement>[0]> = {},
) {
  return createSettlement(
    {
      groupId: data.groupId,
      actorId: data.brunoId,
      receivedBy: data.carlaId,
      amount: 10000n,
      paidAt: PAST_DATE,
      ...overrides,
    },
    db,
  );
}

async function getPayment(id: string) {
  const [row] = await db
    .select()
    .from(settlements)
    .where(eq(settlements.id, id));
  return row;
}

function defaultFilters(
  overrides: Partial<StatementFilters> = {},
): StatementFilters {
  return statementFiltersSchema.parse({
    from: "",
    to: "",
    type: "all",
    status: "all",
    ...overrides,
  });
}

describe("settlement registration", () => {
  it("registra pagamento válido como pendente", async () => {
    const data = await setup();
    await createBaseExpense(data);

    const created = await createPayment(data, { amount: 5000n });
    const payment = await getPayment(created.id);

    expect(payment.paidBy).toBe(data.brunoId);
    expect(payment.receivedBy).toBe(data.carlaId);
    expect(payment.amount).toBe(5000n);
    expect(payment.status).toBe("PENDING");
    expect(payment.confirmedAt).toBeNull();
    expect(payment.cancelledAt).toBeNull();
  });

  it("rejeita valor zero e negativo", async () => {
    const data = await setup();
    await createBaseExpense(data);

    await expect(createPayment(data, { amount: 0n })).rejects.toMatchObject<
      Partial<SettlementDomainError>
    >({ code: "INVALID_AMOUNT" });
    await expect(createPayment(data, { amount: -1n })).rejects.toMatchObject<
      Partial<SettlementDomainError>
    >({ code: "INVALID_AMOUNT" });
  });

  it("rejeita pagador igual ao destinatário", async () => {
    const data = await setup();
    await createBaseExpense(data);

    await expect(
      createPayment(data, { receivedBy: data.brunoId }),
    ).rejects.toMatchObject<Partial<SettlementDomainError>>({
      code: "SELF_PAYMENT",
    });
  });

  it("rejeita usuário fora do grupo como pagador", async () => {
    const data = await setup();
    await createBaseExpense(data);

    await expect(
      createPayment(data, { actorId: data.outsiderId }),
    ).rejects.toBeInstanceOf(GroupAccessError);
  });

  it("rejeita destinatário fora do grupo", async () => {
    const data = await setup();
    await createBaseExpense(data);

    await expect(
      createPayment(data, { receivedBy: data.outsiderId }),
    ).rejects.toBeInstanceOf(GroupAccessError);
  });

  it("rejeita valor superior ao saldo devedor do pagador", async () => {
    const data = await setup();
    await createBaseExpense(data);

    await expect(createPayment(data, { amount: 10001n })).rejects.toMatchObject<
      Partial<SettlementDomainError>
    >({
      code: "INSUFFICIENT_BALANCE",
    });
  });

  it("rejeita valor superior ao saldo credor do destinatário", async () => {
    const data = await setup();
    await createBaseExpense(data);

    await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.aliceId,
        description: "Crédito adicional de Alice",
        totalAmount: 30000n,
        expenseDate: EXPENSE_DATE,
        split: {
          method: "EQUAL",
          participantIds: [data.aliceId, data.brunoId],
        },
      },
      db,
    );

    await expect(createPayment(data, { amount: 25000n })).rejects.toMatchObject<
      Partial<SettlementDomainError>
    >({
      code: "INSUFFICIENT_BALANCE",
    });
  });

  it("reserva pagamentos pendentes para impedir overcommit", async () => {
    const data = await setup();
    await createBaseExpense(data);

    await createPayment(data, { amount: 6000n });

    await expect(createPayment(data, { amount: 4001n })).rejects.toMatchObject<
      Partial<SettlementDomainError>
    >({
      code: "INSUFFICIENT_BALANCE",
    });

    await createPayment(data, { amount: 4000n });

    const rows = await db.select().from(settlements);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.status === "PENDING")).toBe(true);
  });

  it("rejeita data futura", async () => {
    const data = await setup();
    await createBaseExpense(data);

    await expect(
      createPayment(data, {
        paidAt: new Date(Date.now() + 86_400_000),
      }),
    ).rejects.toMatchObject<Partial<SettlementDomainError>>({
      code: "INVALID_DATE",
    });
  });
});

describe("settlement confirmation", () => {
  it("destinatário confirma e atualiza o saldo somente após confirmação", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    const before = await getGroupBalancesForUser(
      data.groupId,
      data.brunoId,
      db,
    );
    expect(
      before?.members.find((member) => member.userId === data.brunoId)?.balance,
    ).toBe(-10000n);

    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    const payment = await getPayment(created.id);
    const after = await getGroupBalancesForUser(data.groupId, data.brunoId, db);

    expect(payment.status).toBe("CONFIRMED");
    expect(payment.confirmedAt).not.toBeNull();
    expect(payment.confirmedAt?.getTime()).toBeGreaterThanOrEqual(
      payment.paidAt.getTime(),
    );
    expect(
      after?.members.find((member) => member.userId === data.brunoId)?.balance,
    ).toBe(0n);
    expect(
      after?.members.find((member) => member.userId === data.carlaId)?.balance,
    ).toBe(10000n);
    expect(
      after?.members.find((member) => member.userId === data.brunoId)
        ?.totalSent,
    ).toBe(10000n);
  });

  it("pagador não pode confirmar o próprio pagamento", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    await expect(
      confirmSettlement(data.groupId, created.id, data.brunoId, db),
    ).rejects.toMatchObject<Partial<SettlementDomainError>>({
      code: "CONFIRM_NOT_ALLOWED",
    });
  });

  it("terceiro não pode confirmar", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    await expect(
      confirmSettlement(data.groupId, created.id, data.aliceId, db),
    ).rejects.toMatchObject<Partial<SettlementDomainError>>({
      code: "CONFIRM_NOT_ALLOWED",
    });
  });

  it("não permite confirmação duplicada", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    await expect(
      confirmSettlement(data.groupId, created.id, data.carlaId, db),
    ).rejects.toMatchObject<Partial<SettlementDomainError>>({
      code: "SETTLEMENT_NOT_PENDING",
    });

    const rows = await db.select().from(settlements);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("CONFIRMED");
  });

  it("não permite confirmar pagamento cancelado", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    await cancelSettlement(data.groupId, created.id, data.brunoId, db);

    await expect(
      confirmSettlement(data.groupId, created.id, data.carlaId, db),
    ).rejects.toMatchObject<Partial<SettlementDomainError>>({
      code: "SETTLEMENT_NOT_PENDING",
    });
  });

  it("revalida os saldos antes de confirmar", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.brunoId,
        description: "Despesa que reduz a dívida de Bruno",
        totalAmount: 20000n,
        expenseDate: EXPENSE_DATE,
        split: {
          method: "EQUAL",
          participantIds: [data.brunoId, data.carlaId],
        },
      },
      db,
    );

    await expect(
      confirmSettlement(data.groupId, created.id, data.carlaId, db),
    ).rejects.toMatchObject<Partial<SettlementDomainError>>({
      code: "BALANCE_CHANGED",
    });

    expect((await getPayment(created.id)).status).toBe("PENDING");
  });

  it("não contabiliza o mesmo pagamento duas vezes", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);
    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    const view = await getGroupBalancesForUser(data.groupId, data.aliceId, db);

    expect(
      view?.members.find((member) => member.userId === data.carlaId)
        ?.totalReceived,
    ).toBe(10000n);
    expect(view?.totalReceived).toBe(10000n);
  });
});

describe("settlement cancellation", () => {
  it("pagador cancela pagamento pendente e preserva histórico", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    await cancelSettlement(data.groupId, created.id, data.brunoId, db);

    const payment = await getPayment(created.id);
    const view = await getGroupBalancesForUser(data.groupId, data.brunoId, db);

    expect(payment.status).toBe("CANCELLED");
    expect(payment.cancelledAt).not.toBeNull();
    expect(payment.cancelledBy).toBe(data.brunoId);
    expect(
      view?.members.find((member) => member.userId === data.brunoId)?.balance,
    ).toBe(-10000n);
  });

  it("administrador pode cancelar pagamento pendente", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    await cancelSettlement(data.groupId, created.id, data.aliceId, db);

    expect((await getPayment(created.id)).status).toBe("CANCELLED");
  });

  it("destinatário não pode cancelar pagamento", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    await expect(
      cancelSettlement(data.groupId, created.id, data.carlaId, db),
    ).rejects.toMatchObject<Partial<SettlementDomainError>>({
      code: "CANCEL_NOT_ALLOWED",
    });
  });

  it("usuário fora do grupo não pode cancelar", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    await expect(
      cancelSettlement(data.groupId, created.id, data.outsiderId, db),
    ).rejects.toBeInstanceOf(GroupAccessError);
  });

  it("pagamento confirmado não pode ser cancelado", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);
    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    await expect(
      cancelSettlement(data.groupId, created.id, data.brunoId, db),
    ).rejects.toMatchObject<Partial<SettlementDomainError>>({
      code: "SETTLEMENT_NOT_PENDING",
    });

    expect((await getPayment(created.id)).status).toBe("CONFIRMED");
  });
});

describe("settlement queries", () => {
  it("lista histórico e aplica filtro de status", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    const all = await listSettlementsForGroup(
      data.groupId,
      data.aliceId,
      "all",
      db,
    );
    const pending = await listSettlementsForGroup(
      data.groupId,
      data.aliceId,
      "PENDING",
      db,
    );
    const confirmed = await listSettlementsForGroup(
      data.groupId,
      data.aliceId,
      "CONFIRMED",
      db,
    );

    expect(all).toHaveLength(1);
    expect(pending).toHaveLength(1);
    expect(confirmed).toHaveLength(0);

    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    expect(
      await listSettlementsForGroup(
        data.groupId,
        data.aliceId,
        "CONFIRMED",
        db,
      ),
    ).toHaveLength(1);
  });

  it("retorna detalhe e permissões do usuário", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    const receiverView = await getSettlementDetailForUser(
      data.groupId,
      created.id,
      data.carlaId,
      db,
    );
    const payerView = await getSettlementDetailForUser(
      data.groupId,
      created.id,
      data.brunoId,
      db,
    );

    expect(receiverView?.canConfirm).toBe(true);
    expect(receiverView?.canCancel).toBe(false);
    expect(payerView?.canConfirm).toBe(false);
    expect(payerView?.canCancel).toBe(true);
  });

  it("calcula o contexto do formulário com reservas pendentes", async () => {
    const data = await setup();
    await createBaseExpense(data);
    await createPayment(data, { amount: 6000n });

    const context = await getSettlementFormContext(
      data.groupId,
      data.brunoId,
      db,
    );

    expect(context).not.toBeNull();
    expect(context?.currentUserAvailableToPay).toBe("4000");
    expect(
      context?.creditors.find((creditor) => creditor.userId === data.carlaId)
        ?.availableToReceive,
    ).toBe("14000");
  });

  it("calcula o painel financeiro e a situação do grupo", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    const pending = await getFinancialDashboardForUser(
      data.groupId,
      data.aliceId,
      db,
    );

    expect(pending?.financialStatus).toBe("pending");
    expect(pending?.totalRegistered).toBe(10000n);
    expect(pending?.totalPending).toBe(10000n);
    expect(pending?.totalConfirmed).toBe(0n);
    expect(pending?.pendingCount).toBe(1);

    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    const confirmed = await getFinancialDashboardForUser(
      data.groupId,
      data.aliceId,
      db,
    );

    expect(confirmed?.financialStatus).toBe("partial");
    expect(confirmed?.totalConfirmed).toBe(10000n);
    expect(confirmed?.totalPending).toBe(0n);
    expect(confirmed?.confirmedCount).toBe(1);
    expect(confirmed?.balances.suggestions).toEqual([
      expect.objectContaining({
        fromUserId: data.aliceId,
        toUserId: data.carlaId,
        amount: 10000n,
      }),
    ]);
  });

  it("marca o grupo como equilibrado após todas as quitações", async () => {
    const data = await setup();
    await createBaseExpense(data);

    const brunoPayment = await createPayment(data);
    await confirmSettlement(data.groupId, brunoPayment.id, data.carlaId, db);

    const alicePayment = await createPayment(data, {
      actorId: data.aliceId,
      amount: 10000n,
    });
    await confirmSettlement(data.groupId, alicePayment.id, data.carlaId, db);

    const dashboard = await getFinancialDashboardForUser(
      data.groupId,
      data.aliceId,
      db,
    );

    expect(dashboard?.financialStatus).toBe("balanced");
    expect(
      dashboard?.balances.members.every((member) => member.balance === 0n),
    ).toBe(true);
    expect(dashboard?.balances.suggestions).toEqual([]);
  });

  it("impede acesso de terceiros ao painel, histórico e contexto", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    expect(
      await getFinancialDashboardForUser(data.groupId, data.outsiderId, db),
    ).toBeNull();
    expect(
      await listSettlementsForGroup(data.groupId, data.outsiderId, "all", db),
    ).toBeNull();
    expect(
      await getSettlementDetailForUser(
        data.groupId,
        created.id,
        data.outsiderId,
        db,
      ),
    ).toBeNull();
    expect(
      await getSettlementFormContext(data.groupId, data.outsiderId, db),
    ).toBeNull();
  });
});

describe("individual statement", () => {
  it("lista despesas e pagamentos enviados e recebidos", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    const brunoStatement = await getIndividualStatement(
      data.groupId,
      data.brunoId,
      defaultFilters(),
      db,
    );

    expect(brunoStatement?.expenses).toHaveLength(1);
    expect(brunoStatement?.settlements).toHaveLength(1);
    expect(brunoStatement?.settlements[0].direction).toBe("sent");
    expect(brunoStatement?.summary.pendingSent).toBe(10000n);
    expect(brunoStatement?.summary.balance).toBe(-10000n);

    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    const carlaStatement = await getIndividualStatement(
      data.groupId,
      data.carlaId,
      defaultFilters(),
      db,
    );

    expect(carlaStatement?.settlements[0].direction).toBe("received");
    expect(carlaStatement?.summary.totalReceived).toBe(10000n);

    const brunoAfter = await getIndividualStatement(
      data.groupId,
      data.brunoId,
      defaultFilters(),
      db,
    );

    expect(brunoAfter?.summary.totalSent).toBe(10000n);
    expect(brunoAfter?.summary.balance).toBe(0n);
    expect(brunoAfter?.summary.pendingSent).toBe(0n);
  });

  it("aplica filtros de tipo, status e período", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    const onlyExpenses = await getIndividualStatement(
      data.groupId,
      data.brunoId,
      defaultFilters({ type: "expenses" }),
      db,
    );
    const onlySent = await getIndividualStatement(
      data.groupId,
      data.brunoId,
      defaultFilters({ type: "sent" }),
      db,
    );
    const onlyPending = await getIndividualStatement(
      data.groupId,
      data.brunoId,
      defaultFilters({ status: "PENDING" }),
      db,
    );
    const outsidePeriod = await getIndividualStatement(
      data.groupId,
      data.brunoId,
      defaultFilters({ from: "2026-10-05", to: "2026-10-10" }),
      db,
    );

    expect(onlyExpenses?.expenses).toHaveLength(1);
    expect(onlyExpenses?.settlements).toHaveLength(0);
    expect(onlySent?.expenses).toHaveLength(0);
    expect(onlySent?.settlements).toHaveLength(1);
    expect(onlyPending?.settlements).toHaveLength(1);
    expect(outsidePeriod?.expenses).toHaveLength(0);
    expect(outsidePeriod?.settlements).toHaveLength(0);

    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    const pendingAfterConfirm = await getIndividualStatement(
      data.groupId,
      data.brunoId,
      defaultFilters({ status: "PENDING" }),
      db,
    );
    const confirmedAfter = await getIndividualStatement(
      data.groupId,
      data.brunoId,
      defaultFilters({ status: "CONFIRMED" }),
      db,
    );

    expect(pendingAfterConfirm?.settlements).toHaveLength(0);
    expect(confirmedAfter?.settlements).toHaveLength(1);
  });

  it("impede acesso ao extrato de outro grupo", async () => {
    const data = await setup();
    await createBaseExpense(data);

    expect(
      await getIndividualStatement(
        data.groupId,
        data.outsiderId,
        defaultFilters(),
        db,
      ),
    ).toBeNull();
  });

  it("mantém consistência entre extrato e saldos", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);
    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    const balances = await getGroupBalancesForUser(
      data.groupId,
      data.brunoId,
      db,
    );
    const statement = await getIndividualStatement(
      data.groupId,
      data.brunoId,
      defaultFilters(),
      db,
    );
    const member = balances?.members.find(
      (item) => item.userId === data.brunoId,
    );

    expect(statement?.summary.totalPaid).toBe(member?.totalPaid);
    expect(statement?.summary.totalOwed).toBe(member?.totalOwed);
    expect(statement?.summary.totalSent).toBe(member?.totalSent);
    expect(statement?.summary.balance).toBe(member?.balance);
  });
});

describe("expenses with settlements", () => {
  async function baseExpenseId(data: Setup) {
    const created = await createBaseExpense(data);
    return created.id;
  }

  it("bloqueia edição e cancelamento com pagamento pendente", async () => {
    const data = await setup();
    const expenseId = await baseExpenseId(data);
    await createPayment(data);

    await expect(
      updateExpense(
        {
          expenseId,
          groupId: data.groupId,
          actorId: data.aliceId,
          paidBy: data.carlaId,
          description: "Alterada",
          totalAmount: 30000n,
          expenseDate: EXPENSE_DATE,
          split: {
            method: "EQUAL",
            participantIds: [data.aliceId, data.brunoId, data.carlaId],
          },
        },
        db,
      ),
    ).rejects.toMatchObject({ code: "EXPENSE_HAS_SETTLEMENTS" });

    await expect(
      cancelExpense(data.groupId, expenseId, data.aliceId, db),
    ).rejects.toMatchObject({ code: "EXPENSE_HAS_SETTLEMENTS" });

    const rows = await db.select().from(settlements);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("PENDING");
  });

  it("bloqueia edição e cancelamento com pagamento confirmado", async () => {
    const data = await setup();
    const expenseId = await baseExpenseId(data);
    const created = await createPayment(data);
    await confirmSettlement(data.groupId, created.id, data.carlaId, db);

    await expect(
      updateExpense(
        {
          expenseId,
          groupId: data.groupId,
          actorId: data.aliceId,
          paidBy: data.carlaId,
          description: "Alterada",
          totalAmount: 30000n,
          expenseDate: EXPENSE_DATE,
          split: {
            method: "EQUAL",
            participantIds: [data.aliceId, data.brunoId, data.carlaId],
          },
        },
        db,
      ),
    ).rejects.toMatchObject({ code: "EXPENSE_HAS_SETTLEMENTS" });

    await expect(
      cancelExpense(data.groupId, expenseId, data.aliceId, db),
    ).rejects.toMatchObject({ code: "EXPENSE_HAS_SETTLEMENTS" });
  });

  it("permite criar novas despesas com pagamento pendente", async () => {
    const data = await setup();
    await createBaseExpense(data);
    await createPayment(data);

    const created = await createExpense(
      {
        groupId: data.groupId,
        actorId: data.aliceId,
        paidBy: data.aliceId,
        description: "Nova despesa",
        totalAmount: 1000n,
        expenseDate: EXPENSE_DATE,
        split: {
          method: "EQUAL",
          participantIds: [data.aliceId, data.brunoId],
        },
      },
      db,
    );

    expect(created.id).toEqual(expect.any(String));
  });
});

describe("settlement concurrency", () => {
  it("duas confirmações simultâneas resultam em uma única confirmação", async () => {
    const data = await setup();
    await createBaseExpense(data);
    const created = await createPayment(data);

    const results = await Promise.allSettled([
      confirmSettlement(data.groupId, created.id, data.carlaId, db),
      confirmSettlement(data.groupId, created.id, data.carlaId, db),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);

    const rows = await db.select().from(settlements);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("CONFIRMED");
  });

  it("dois registros concorrentes sobre o mesmo saldo respeitam a reserva", async () => {
    const data = await setup();
    await createBaseExpense(data);

    const results = await Promise.allSettled([
      createPayment(data, { amount: 10000n }),
      createPayment(data, { amount: 10000n }),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);

    const rows = await db.select().from(settlements);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("PENDING");
  });
});

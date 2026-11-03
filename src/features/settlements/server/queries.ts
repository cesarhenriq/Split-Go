import { and, desc, eq, isNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  expenseSplits,
  expenses,
  groups,
  settlements,
  users,
} from "@/db/schema";
import { getGroupBalancesForUser } from "@/features/balances/server/queries";
import {
  type GroupDatabase,
  getActiveGroupMembership,
} from "@/features/groups/server/group-access";
import type {
  FinancialDashboardView,
  FinancialStatus,
  SettlementDetail,
  SettlementFormContext,
  SettlementListItem,
  SettlementStatus,
  StatementExpenseRow,
  StatementSettlementRow,
  StatementView,
} from "@/features/settlements/types";
import { formatCentsInput } from "@/lib/money";
import { isValidExpenseDate } from "@/lib/validation/expenses";
import type { StatementFilters } from "@/lib/validation/settlements";

function mapSettlement(
  row: {
    id: string;
    groupId: string;
    paidBy: string;
    paidByName: string;
    receivedBy: string;
    receivedByName: string;
    amount: bigint;
    status: SettlementStatus;
    paidAt: Date;
    confirmedAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    cancelledByName: string | null;
  },
  userId: string,
  role: "ADMIN" | "MEMBER",
): SettlementDetail {
  return {
    id: row.id,
    groupId: row.groupId,
    paidById: row.paidBy,
    paidByName: row.paidByName,
    receivedById: row.receivedBy,
    receivedByName: row.receivedByName,
    amount: row.amount.toString(),
    status: row.status,
    paidAt: row.paidAt.toISOString().slice(0, 10),
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    cancelledByName: row.cancelledByName,
    createdAt: row.createdAt.toISOString(),
    canConfirm: row.status === "PENDING" && row.receivedBy === userId,
    canCancel:
      row.status === "PENDING" && (row.paidBy === userId || role === "ADMIN"),
  };
}

function settlementSelection() {
  const payer = alias(users, "settlement_payer");
  const receiver = alias(users, "settlement_receiver");
  const canceller = alias(users, "settlement_canceller");

  return {
    payer,
    receiver,
    canceller,
    select: {
      id: settlements.id,
      groupId: settlements.groupId,
      paidBy: settlements.paidBy,
      paidByName: payer.name,
      receivedBy: settlements.receivedBy,
      receivedByName: receiver.name,
      amount: settlements.amount,
      status: settlements.status,
      paidAt: settlements.paidAt,
      confirmedAt: settlements.confirmedAt,
      cancelledAt: settlements.cancelledAt,
      createdAt: settlements.createdAt,
      cancelledByName: canceller.name,
    },
  };
}

export async function listSettlementsForGroup(
  groupId: string,
  userId: string,
  status: "all" | SettlementStatus = "all",
  database: GroupDatabase = db,
): Promise<SettlementListItem[] | null> {
  const membership = await getActiveGroupMembership(database, groupId, userId);

  if (!membership) {
    return null;
  }

  const { payer, receiver, canceller, select } = settlementSelection();
  const conditions = [eq(settlements.groupId, groupId)];

  if (status !== "all") {
    conditions.push(eq(settlements.status, status));
  }

  const rows = await database
    .select(select)
    .from(settlements)
    .innerJoin(payer, eq(payer.id, settlements.paidBy))
    .innerJoin(receiver, eq(receiver.id, settlements.receivedBy))
    .leftJoin(canceller, eq(canceller.id, settlements.cancelledBy))
    .where(and(...conditions))
    .orderBy(desc(settlements.createdAt));

  return rows.map((row) => mapSettlement(row, userId, membership.role));
}

export async function getSettlementDetailForUser(
  groupId: string,
  settlementId: string,
  userId: string,
  database: GroupDatabase = db,
): Promise<SettlementDetail | null> {
  const membership = await getActiveGroupMembership(database, groupId, userId);

  if (!membership) {
    return null;
  }

  const { payer, receiver, canceller, select } = settlementSelection();

  const [settlement] = await database
    .select(select)
    .from(settlements)
    .innerJoin(payer, eq(payer.id, settlements.paidBy))
    .innerJoin(receiver, eq(receiver.id, settlements.receivedBy))
    .leftJoin(canceller, eq(canceller.id, settlements.cancelledBy))
    .where(
      and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)),
    )
    .limit(1);

  if (!settlement) {
    return null;
  }

  return mapSettlement(settlement, userId, membership.role);
}

export async function getSettlementFormContext(
  groupId: string,
  userId: string,
  database: GroupDatabase = db,
): Promise<SettlementFormContext | null> {
  const membership = await getActiveGroupMembership(database, groupId, userId);

  if (!membership) {
    return null;
  }

  const [group] = await database
    .select({ name: groups.name })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) {
    return null;
  }

  const balances = await getGroupBalancesForUser(groupId, userId, database);

  if (!balances) {
    return null;
  }

  const pendingRows = await database
    .select({
      paidBy: settlements.paidBy,
      receivedBy: settlements.receivedBy,
      amount: settlements.amount,
    })
    .from(settlements)
    .where(
      and(eq(settlements.groupId, groupId), eq(settlements.status, "PENDING")),
    );

  const pendingSent = new Map<string, bigint>();
  const pendingReceived = new Map<string, bigint>();

  for (const pending of pendingRows) {
    pendingSent.set(
      pending.paidBy,
      (pendingSent.get(pending.paidBy) ?? 0n) + pending.amount,
    );
    pendingReceived.set(
      pending.receivedBy,
      (pendingReceived.get(pending.receivedBy) ?? 0n) + pending.amount,
    );
  }

  const currentMember = balances.members.find(
    (member) => member.userId === userId,
  );
  const currentDebt = currentMember?.balance ?? 0n;
  const currentPendingSent = pendingSent.get(userId) ?? 0n;
  const availableToPay =
    currentDebt < 0n
      ? -currentDebt - currentPendingSent > 0n
        ? -currentDebt - currentPendingSent
        : 0n
      : 0n;

  const creditors = balances.members
    .filter((member) => member.isActiveMember && member.balance > 0n)
    .map((member) => {
      const pending = pendingReceived.get(member.userId) ?? 0n;
      const available = member.balance - pending;

      return {
        userId: member.userId,
        name: member.name,
        email: member.email,
        availableToReceive: available > 0n ? available : 0n,
      };
    })
    .filter((member) => member.availableToReceive > 0n);

  return {
    groupId,
    groupName: group.name,
    currentUserId: userId,
    currentUserName: currentMember?.name ?? "",
    currentUserAvailableToPay: availableToPay.toString(),
    creditors: creditors.map((creditor) => ({
      ...creditor,
      availableToReceive: creditor.availableToReceive.toString(),
    })),
    pendingCount: pendingRows.length,
  };
}

export async function getFinancialDashboardForUser(
  groupId: string,
  userId: string,
  database: GroupDatabase = db,
): Promise<FinancialDashboardView | null> {
  const balances = await getGroupBalancesForUser(groupId, userId, database);

  if (!balances) {
    return null;
  }

  const settlementsList = await listSettlementsForGroup(
    groupId,
    userId,
    "all",
    database,
  );

  if (!settlementsList) {
    return null;
  }

  const totalRegistered = settlementsList.reduce(
    (total, settlement) => total + BigInt(settlement.amount),
    0n,
  );
  const totalConfirmed = settlementsList
    .filter((settlement) => settlement.status === "CONFIRMED")
    .reduce((total, settlement) => total + BigInt(settlement.amount), 0n);
  const totalPending = settlementsList
    .filter((settlement) => settlement.status === "PENDING")
    .reduce((total, settlement) => total + BigInt(settlement.amount), 0n);
  const pendingSettlements = settlementsList.filter(
    (settlement) => settlement.status === "PENDING",
  );

  const financialStatus: FinancialStatus =
    pendingSettlements.length > 0
      ? "pending"
      : balances.members.every((member) => member.balance === 0n)
        ? "balanced"
        : settlementsList.some(
              (settlement) => settlement.status === "CONFIRMED",
            )
          ? "partial"
          : "open";

  return {
    balances,
    financialStatus,
    totalRegistered,
    totalConfirmed,
    totalPending,
    pendingCount: pendingSettlements.length,
    confirmedCount: settlementsList.filter(
      (settlement) => settlement.status === "CONFIRMED",
    ).length,
    cancelledCount: settlementsList.filter(
      (settlement) => settlement.status === "CANCELLED",
    ).length,
    pendingSettlements,
  };
}

function dateInRange(value: string, from: string, to: string): boolean {
  const date = value.slice(0, 10);

  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export async function getIndividualStatement(
  groupId: string,
  userId: string,
  filters: StatementFilters,
  database: GroupDatabase = db,
): Promise<StatementView | null> {
  const membership = await getActiveGroupMembership(database, groupId, userId);

  if (!membership) {
    return null;
  }

  const balances = await getGroupBalancesForUser(groupId, userId, database);

  if (!balances) {
    return null;
  }

  const currentMember = balances.members.find(
    (member) => member.userId === userId,
  );

  if (!currentMember) {
    return null;
  }

  const [group] = await database
    .select({ name: groups.name })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) {
    return null;
  }

  const payer = alias(users, "statement_payer");
  const expenseRows = await database
    .select({
      id: expenses.id,
      description: expenses.description,
      expenseDate: expenses.expenseDate,
      totalAmount: expenses.totalAmount,
      paidBy: expenses.paidBy,
      paidByName: payer.name,
    })
    .from(expenses)
    .innerJoin(payer, eq(payer.id, expenses.paidBy))
    .where(and(eq(expenses.groupId, groupId), isNull(expenses.cancelledAt)));

  const splitRows = await database
    .select({
      expenseId: expenseSplits.expenseId,
      shareAmount: expenseSplits.shareAmount,
    })
    .from(expenseSplits)
    .innerJoin(expenses, eq(expenses.id, expenseSplits.expenseId))
    .where(
      and(
        eq(expenses.groupId, groupId),
        eq(expenseSplits.userId, userId),
        isNull(expenses.cancelledAt),
      ),
    );

  const shareByExpense = new Map(
    splitRows.map((split) => [split.expenseId, split.shareAmount]),
  );

  const statementExpenses: StatementExpenseRow[] = expenseRows
    .filter(
      (expense) => expense.paidBy === userId || shareByExpense.has(expense.id),
    )
    .filter((expense) =>
      dateInRange(expense.expenseDate.toISOString(), filters.from, filters.to),
    )
    .map((expense) => ({
      expenseId: expense.id,
      description: expense.description,
      expenseDate: expense.expenseDate.toISOString().slice(0, 10),
      totalAmount: expense.totalAmount.toString(),
      userShare: (shareByExpense.get(expense.id) ?? 0n).toString(),
      paidByName: expense.paidByName,
      userIsPayer: expense.paidBy === userId,
    }));

  const sentPayer = alias(users, "statement_sent_payer");
  const sentReceiver = alias(users, "statement_sent_receiver");
  const settlementRows = await database
    .select({
      id: settlements.id,
      paidBy: settlements.paidBy,
      receivedBy: settlements.receivedBy,
      paidByName: sentPayer.name,
      receivedByName: sentReceiver.name,
      amount: settlements.amount,
      status: settlements.status,
      paidAt: settlements.paidAt,
      confirmedAt: settlements.confirmedAt,
      cancelledAt: settlements.cancelledAt,
    })
    .from(settlements)
    .innerJoin(sentPayer, eq(sentPayer.id, settlements.paidBy))
    .innerJoin(sentReceiver, eq(sentReceiver.id, settlements.receivedBy))
    .where(
      and(
        eq(settlements.groupId, groupId),
        or(eq(settlements.paidBy, userId), eq(settlements.receivedBy, userId)),
      ),
    )
    .orderBy(desc(settlements.createdAt));

  const statementSettlements: StatementSettlementRow[] = settlementRows
    .filter(
      (settlement) =>
        filters.status === "all" || settlement.status === filters.status,
    )
    .filter((settlement) =>
      dateInRange(settlement.paidAt.toISOString(), filters.from, filters.to),
    )
    .map((settlement) => {
      const direction =
        settlement.paidBy === userId
          ? ("sent" as const)
          : ("received" as const);

      return {
        settlementId: settlement.id,
        direction,
        counterpartName:
          direction === "sent"
            ? settlement.receivedByName
            : settlement.paidByName,
        amount: settlement.amount.toString(),
        status: settlement.status,
        paidAt: settlement.paidAt.toISOString().slice(0, 10),
        confirmedAt: settlement.confirmedAt?.toISOString() ?? null,
        cancelledAt: settlement.cancelledAt?.toISOString() ?? null,
      };
    });

  const pendingSent = settlementRows
    .filter(
      (settlement) =>
        settlement.paidBy === userId && settlement.status === "PENDING",
    )
    .reduce((total, settlement) => total + settlement.amount, 0n);
  const pendingReceived = settlementRows
    .filter(
      (settlement) =>
        settlement.receivedBy === userId && settlement.status === "PENDING",
    )
    .reduce((total, settlement) => total + settlement.amount, 0n);

  const includeExpenses = filters.type === "all" || filters.type === "expenses";
  const includeSent = filters.type === "all" || filters.type === "sent";
  const includeReceived = filters.type === "all" || filters.type === "received";

  return {
    groupName: group.name,
    memberName: currentMember.name,
    summary: {
      totalPaid: currentMember.totalPaid,
      totalOwed: currentMember.totalOwed,
      totalSent: currentMember.totalSent,
      totalReceived: currentMember.totalReceived,
      balance: currentMember.balance,
      pendingSent,
      pendingReceived,
    },
    expenses: includeExpenses ? statementExpenses : [],
    settlements: statementSettlements.filter(
      (settlement) =>
        (settlement.direction === "sent" && includeSent) ||
        (settlement.direction === "received" && includeReceived),
    ),
  };
}

export function formatSettlementAmountForInput(amount: string) {
  return formatCentsInput(amount);
}

export function isValidStatementDate(value: string) {
  return !value || isValidExpenseDate(value);
}

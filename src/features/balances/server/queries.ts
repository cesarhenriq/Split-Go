import { and, asc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  expenseSplits,
  expenses,
  groupMembers,
  groups,
  settlements,
  users,
} from "@/db/schema";
import type { GroupBalancesView } from "@/features/balances/types";
import {
  type GroupDatabase,
  getActiveGroupMembership,
} from "@/features/groups/server/group-access";
import { calculateGroupBalances } from "@/lib/finance/calculate-balances";
import type {
  BalanceExpenseInput,
  BalanceMemberInput,
  BalanceSplitInput,
} from "@/lib/finance/finance-types";
import { simplifyDebts } from "@/lib/finance/simplify-debts";

export async function getGroupBalancesForUser(
  groupId: string,
  userId: string,
  database: GroupDatabase = db,
): Promise<GroupBalancesView | null> {
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

  const activeMembers = await database
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, "ACCEPTED"),
        isNull(groupMembers.leftAt),
      ),
    )
    .orderBy(asc(users.name));

  const payer = alias(users, "payer");

  const validExpenses = await database
    .select({
      id: expenses.id,
      paidBy: expenses.paidBy,
      paidByName: payer.name,
      paidByEmail: payer.email,
      totalAmount: expenses.totalAmount,
      cancelledAt: expenses.cancelledAt,
    })
    .from(expenses)
    .innerJoin(payer, eq(payer.id, expenses.paidBy))
    .where(and(eq(expenses.groupId, groupId), isNull(expenses.cancelledAt)));

  const settlementPayer = alias(users, "settlement_balance_payer");
  const settlementReceiver = alias(users, "settlement_balance_receiver");

  const confirmedSettlements = await database
    .select({
      id: settlements.id,
      paidBy: settlements.paidBy,
      paidByName: settlementPayer.name,
      paidByEmail: settlementPayer.email,
      receivedBy: settlements.receivedBy,
      receivedByName: settlementReceiver.name,
      receivedByEmail: settlementReceiver.email,
      amount: settlements.amount,
      status: settlements.status,
    })
    .from(settlements)
    .innerJoin(settlementPayer, eq(settlementPayer.id, settlements.paidBy))
    .innerJoin(
      settlementReceiver,
      eq(settlementReceiver.id, settlements.receivedBy),
    )
    .where(
      and(
        eq(settlements.groupId, groupId),
        eq(settlements.status, "CONFIRMED"),
      ),
    );

  const splitRows = await database
    .select({
      expenseId: expenseSplits.expenseId,
      userId: users.id,
      name: users.name,
      email: users.email,
      shareAmount: expenseSplits.shareAmount,
    })
    .from(expenseSplits)
    .innerJoin(expenses, eq(expenses.id, expenseSplits.expenseId))
    .innerJoin(users, eq(users.id, expenseSplits.userId))
    .where(and(eq(expenses.groupId, groupId), isNull(expenses.cancelledAt)));

  const memberMap = new Map<string, BalanceMemberInput>();

  for (const member of activeMembers) {
    memberMap.set(member.userId, {
      userId: member.userId,
      name: member.name,
      email: member.email,
      isActiveMember: true,
    });
  }

  for (const expense of validExpenses) {
    if (!memberMap.has(expense.paidBy)) {
      memberMap.set(expense.paidBy, {
        userId: expense.paidBy,
        name: expense.paidByName,
        email: expense.paidByEmail,
        isActiveMember: false,
      });
    }
  }

  const splitsByExpense = new Map<string, BalanceSplitInput[]>();

  for (const split of splitRows) {
    if (!memberMap.has(split.userId)) {
      memberMap.set(split.userId, {
        userId: split.userId,
        name: split.name,
        email: split.email,
        isActiveMember: false,
      });
    }

    const splits = splitsByExpense.get(split.expenseId) ?? [];
    splits.push({
      userId: split.userId,
      shareAmount: split.shareAmount,
    });
    splitsByExpense.set(split.expenseId, splits);
  }

  for (const settlement of confirmedSettlements) {
    if (!memberMap.has(settlement.paidBy)) {
      memberMap.set(settlement.paidBy, {
        userId: settlement.paidBy,
        name: settlement.paidByName,
        email: settlement.paidByEmail,
        isActiveMember: false,
      });
    }

    if (!memberMap.has(settlement.receivedBy)) {
      memberMap.set(settlement.receivedBy, {
        userId: settlement.receivedBy,
        name: settlement.receivedByName,
        email: settlement.receivedByEmail,
        isActiveMember: false,
      });
    }
  }

  const balanceExpenses: BalanceExpenseInput[] = validExpenses.map(
    (expense) => ({
      id: expense.id,
      paidBy: expense.paidBy,
      totalAmount: expense.totalAmount,
      cancelledAt: expense.cancelledAt,
      splits: splitsByExpense.get(expense.id) ?? [],
    }),
  );

  const members = calculateGroupBalances(
    balanceExpenses,
    [...memberMap.values()],
    confirmedSettlements,
  );
  const suggestions = simplifyDebts(members);

  const totalExpenses = validExpenses.reduce(
    (total, expense) => total + expense.totalAmount,
    0n,
  );
  const totalPaid = members.reduce(
    (total, member) => total + member.totalPaid,
    0n,
  );
  const totalOwed = members.reduce(
    (total, member) => total + member.totalOwed,
    0n,
  );
  const totalToReceive = members.reduce(
    (total, member) => (member.balance > 0n ? total + member.balance : total),
    0n,
  );
  const totalToPay = members.reduce(
    (total, member) => (member.balance < 0n ? total - member.balance : total),
    0n,
  );
  const totalSuggested = suggestions.reduce(
    (total, suggestion) => total + suggestion.amount,
    0n,
  );
  const totalSent = members.reduce(
    (total, member) => total + member.totalSent,
    0n,
  );
  const totalReceived = members.reduce(
    (total, member) => total + member.totalReceived,
    0n,
  );

  return {
    groupName: group.name,
    members,
    suggestions,
    totalExpenses,
    totalPaid,
    totalOwed,
    totalToReceive,
    totalToPay,
    totalSent,
    totalReceived,
    totalSuggested,
    creditorsCount: members.filter((member) => member.balance > 0n).length,
    debtorsCount: members.filter((member) => member.balance < 0n).length,
  };
}

import { and, asc, desc, eq, gte, ilike, isNull, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  expenseSplits,
  expenses,
  groupMembers,
  groups,
  users,
} from "@/db/schema";
import type { Database } from "@/db/types";
import { canManageExpense } from "@/features/expenses/server/expense-access";
import type {
  ExpenseDetail,
  ExpenseFormContext,
  ExpenseFormInitial,
  ExpenseListResult,
} from "@/features/expenses/types";
import { getActiveGroupMembership } from "@/features/groups/server/group-access";
import { formatPercentageInput } from "@/lib/money";
import type { ExpenseFilters } from "@/lib/validation/expenses";
import { parseExpenseDate } from "@/lib/validation/expenses";

const pageSize = 20;

function buildConditions(groupId: string, filters: ExpenseFilters) {
  const conditions = [eq(expenses.groupId, groupId)];

  if (!filters.includeCancelled) {
    conditions.push(isNull(expenses.cancelledAt));
  }

  if (filters.description) {
    conditions.push(ilike(expenses.description, `%${filters.description}%`));
  }

  if (filters.from) {
    conditions.push(gte(expenses.expenseDate, parseExpenseDate(filters.from)));
  }

  if (filters.to) {
    conditions.push(lte(expenses.expenseDate, parseExpenseDate(filters.to)));
  }

  if (filters.paidBy) {
    conditions.push(eq(expenses.paidBy, filters.paidBy));
  }

  return and(...conditions);
}

export async function listGroupExpenses(
  groupId: string,
  userId: string,
  filters: ExpenseFilters,
  database: Database = db,
): Promise<ExpenseListResult | null> {
  const membership = await getActiveGroupMembership(database, groupId, userId);

  if (!membership) {
    return null;
  }

  const payer = alias(users, "payer");
  const creator = alias(users, "creator");
  const where = buildConditions(groupId, filters);

  const [countRow] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(expenses)
    .where(where);

  const total = Number(countRow?.count ?? 0);
  const page = Math.max(1, filters.page);
  const offset = (page - 1) * pageSize;

  const rows = await database
    .select({
      id: expenses.id,
      groupId: expenses.groupId,
      description: expenses.description,
      totalAmount: expenses.totalAmount,
      expenseDate: expenses.expenseDate,
      paidById: expenses.paidBy,
      paidByName: payer.name,
      createdById: expenses.createdBy,
      createdByName: creator.name,
      splitMethod: expenses.splitMethod,
      cancelledAt: expenses.cancelledAt,
      createdAt: expenses.createdAt,
      participantCount: sql<number>`(
        select count(*)::int
        from "expense_splits" es
        where es."expense_id" = ${expenses.id}
      )`,
    })
    .from(expenses)
    .innerJoin(payer, eq(payer.id, expenses.paidBy))
    .innerJoin(creator, eq(creator.id, expenses.createdBy))
    .where(where)
    .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map((row) => ({
      id: row.id,
      groupId: row.groupId,
      description: row.description,
      totalAmount: row.totalAmount.toString(),
      expenseDate: row.expenseDate.toISOString().slice(0, 10),
      paidById: row.paidById,
      paidByName: row.paidByName,
      createdById: row.createdById,
      createdByName: row.createdByName,
      splitMethod: row.splitMethod,
      participantCount: Number(row.participantCount),
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getExpenseDetailForUser(
  groupId: string,
  expenseId: string,
  userId: string,
  database: Database = db,
): Promise<ExpenseDetail | null> {
  const membership = await getActiveGroupMembership(database, groupId, userId);

  if (!membership) {
    return null;
  }

  const payer = alias(users, "payer");
  const creator = alias(users, "creator");
  const canceller = alias(users, "canceller");

  const [expense] = await database
    .select({
      id: expenses.id,
      groupId: expenses.groupId,
      groupName: groups.name,
      description: expenses.description,
      totalAmount: expenses.totalAmount,
      expenseDate: expenses.expenseDate,
      paidById: expenses.paidBy,
      paidByName: payer.name,
      createdById: expenses.createdBy,
      createdByName: creator.name,
      splitMethod: expenses.splitMethod,
      cancelledAt: expenses.cancelledAt,
      cancelledByName: canceller.name,
    })
    .from(expenses)
    .innerJoin(groups, eq(groups.id, expenses.groupId))
    .innerJoin(payer, eq(payer.id, expenses.paidBy))
    .innerJoin(creator, eq(creator.id, expenses.createdBy))
    .leftJoin(canceller, eq(canceller.id, expenses.cancelledBy))
    .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)))
    .limit(1);

  if (!expense) {
    return null;
  }

  const splitRows = await database
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      shareAmount: expenseSplits.shareAmount,
      percentage: expenseSplits.percentage,
    })
    .from(expenseSplits)
    .innerJoin(users, eq(users.id, expenseSplits.userId))
    .where(eq(expenseSplits.expenseId, expenseId))
    .orderBy(asc(users.name));

  const totalRated = splitRows.reduce(
    (total, split) => total + split.shareAmount,
    0n,
  );
  const canManage =
    !expense.cancelledAt &&
    canManageExpense(expense.createdById, userId, membership.role);

  return {
    id: expense.id,
    groupId: expense.groupId,
    groupName: expense.groupName,
    description: expense.description,
    totalAmount: expense.totalAmount.toString(),
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    paidById: expense.paidById,
    paidByName: expense.paidByName,
    createdById: expense.createdById,
    createdByName: expense.createdByName,
    splitMethod: expense.splitMethod,
    cancelledAt: expense.cancelledAt?.toISOString() ?? null,
    cancelledByName: expense.cancelledByName,
    splits: splitRows.map((split) => ({
      userId: split.userId,
      name: split.name,
      email: split.email,
      shareAmount: split.shareAmount.toString(),
      percentage: split.percentage,
    })),
    totalRated: totalRated.toString(),
    difference: (expense.totalAmount - totalRated).toString(),
    canEdit: canManage,
    canCancel: canManage,
  };
}

export async function getExpenseFormContext(
  groupId: string,
  userId: string,
  database: Database = db,
): Promise<ExpenseFormContext | null> {
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

  const members = await database
    .select({
      id: users.id,
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

  return {
    groupId,
    groupName: group.name,
    currentUserId: userId,
    currentUserRole: membership.role,
    members,
  };
}

export async function getExpenseForEdit(
  groupId: string,
  expenseId: string,
  userId: string,
  database: Database = db,
): Promise<ExpenseFormInitial | null> {
  const membership = await getActiveGroupMembership(database, groupId, userId);

  if (!membership) {
    return null;
  }

  const [expense] = await database
    .select({
      id: expenses.id,
      description: expenses.description,
      totalAmount: expenses.totalAmount,
      expenseDate: expenses.expenseDate,
      paidBy: expenses.paidBy,
      splitMethod: expenses.splitMethod,
      createdBy: expenses.createdBy,
      cancelledAt: expenses.cancelledAt,
    })
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)))
    .limit(1);

  if (
    !expense ||
    expense.cancelledAt ||
    !canManageExpense(expense.createdBy, userId, membership.role)
  ) {
    return null;
  }

  const splitRows = await database
    .select({
      userId: expenseSplits.userId,
      shareAmount: expenseSplits.shareAmount,
      percentage: expenseSplits.percentage,
    })
    .from(expenseSplits)
    .where(eq(expenseSplits.expenseId, expenseId));

  return {
    expenseId: expense.id,
    description: expense.description,
    totalAmount: expense.totalAmount.toString(),
    expenseDate: expense.expenseDate.toISOString().slice(0, 10),
    paidBy: expense.paidBy,
    splitMethod: expense.splitMethod,
    participants: splitRows.map((split) => ({
      userId: split.userId,
      percentage:
        split.percentage === null
          ? null
          : formatPercentageInput(split.percentage),
      amount:
        expense.splitMethod === "FIXED" ? split.shareAmount.toString() : null,
    })),
  };
}

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { expenseSplits, expenses, settlements } from "@/db/schema";
import type { Database } from "@/db/types";
import {
  canManageExpense,
  ExpenseDomainError,
} from "@/features/expenses/server/expense-access";
import { calculateExpenseSplits } from "@/features/expenses/server/split-service";
import type { ExpenseSplitInput } from "@/features/expenses/types";
import {
  assertActiveGroupMembers,
  GroupAccessError,
  lockActiveGroupMembership,
} from "@/features/groups/server/group-access";
import { lockGroupForFinancialMutation } from "@/features/groups/server/group-locks";

export type UpdateExpenseInput = {
  expenseId: string;
  groupId: string;
  actorId: string;
  paidBy: string;
  description: string;
  totalAmount: bigint;
  expenseDate: Date;
  split: ExpenseSplitInput;
};

export async function updateExpense(
  input: UpdateExpenseInput,
  database: Database = db,
): Promise<void> {
  const shares = calculateExpenseSplits(input.totalAmount, input.split);
  const participantIds = shares.map((share) => share.userId);

  await database.transaction(async (tx) => {
    await lockGroupForFinancialMutation(tx, input.groupId);

    const [activeSettlement] = await tx
      .select({ id: settlements.id })
      .from(settlements)
      .where(
        and(
          eq(settlements.groupId, input.groupId),
          inArray(settlements.status, ["PENDING", "CONFIRMED"]),
        ),
      )
      .limit(1);

    if (activeSettlement) {
      throw new ExpenseDomainError(
        "EXPENSE_HAS_SETTLEMENTS",
        "Despesas não podem ser editadas enquanto houver pagamentos pendentes ou confirmados no grupo.",
      );
    }

    const membership = await lockActiveGroupMembership(
      tx,
      input.groupId,
      input.actorId,
    );

    if (!membership) {
      throw new GroupAccessError(
        "GROUP_MEMBER_REQUIRED",
        "Você não participa deste grupo.",
      );
    }

    const [expense] = await tx
      .select({
        id: expenses.id,
        createdBy: expenses.createdBy,
        cancelledAt: expenses.cancelledAt,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.id, input.expenseId),
          eq(expenses.groupId, input.groupId),
        ),
      )
      .limit(1)
      .for("update");

    if (!expense) {
      throw new ExpenseDomainError(
        "EXPENSE_NOT_FOUND",
        "Despesa não encontrada.",
      );
    }

    if (expense.cancelledAt) {
      throw new ExpenseDomainError(
        "EXPENSE_CANCELLED",
        "Despesas canceladas não podem ser editadas.",
      );
    }

    if (!canManageExpense(expense.createdBy, input.actorId, membership.role)) {
      throw new ExpenseDomainError(
        "EXPENSE_FORBIDDEN",
        "Somente o criador da despesa ou um administrador pode editá-la.",
      );
    }

    await assertActiveGroupMembers(tx, input.groupId, [
      input.paidBy,
      ...participantIds,
    ]);

    await tx
      .update(expenses)
      .set({
        paidBy: input.paidBy,
        description: input.description,
        totalAmount: input.totalAmount,
        splitMethod: input.split.method,
        expenseDate: input.expenseDate,
      })
      .where(eq(expenses.id, input.expenseId));

    await tx
      .delete(expenseSplits)
      .where(eq(expenseSplits.expenseId, input.expenseId));

    await tx.insert(expenseSplits).values(
      shares.map((share) => ({
        expenseId: input.expenseId,
        userId: share.userId,
        shareAmount: share.shareAmount,
        percentage: share.percentage,
      })),
    );
  });
}

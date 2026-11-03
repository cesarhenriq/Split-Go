import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import type { Database } from "@/db/types";
import {
  canManageExpense,
  ExpenseDomainError,
} from "@/features/expenses/server/expense-access";
import {
  GroupAccessError,
  lockActiveGroupMembership,
} from "@/features/groups/server/group-access";

export async function cancelExpense(
  groupId: string,
  expenseId: string,
  actorId: string,
  database: Database = db,
): Promise<void> {
  await database.transaction(async (tx) => {
    const membership = await lockActiveGroupMembership(tx, groupId, actorId);

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
      .where(and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId)))
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
        "Esta despesa já está cancelada.",
      );
    }

    if (!canManageExpense(expense.createdBy, actorId, membership.role)) {
      throw new ExpenseDomainError(
        "EXPENSE_FORBIDDEN",
        "Somente o criador da despesa ou um administrador pode cancelá-la.",
      );
    }

    await tx
      .update(expenses)
      .set({
        cancelledAt: new Date(),
        cancelledBy: actorId,
      })
      .where(eq(expenses.id, expenseId));
  });
}

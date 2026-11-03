import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { expenses, settlements } from "@/db/schema";
import type { Database } from "@/db/types";
import {
  canManageExpense,
  ExpenseDomainError,
} from "@/features/expenses/server/expense-access";
import {
  GroupAccessError,
  lockActiveGroupMembership,
} from "@/features/groups/server/group-access";
import { lockGroupForFinancialMutation } from "@/features/groups/server/group-locks";

export async function cancelExpense(
  groupId: string,
  expenseId: string,
  actorId: string,
  database: Database = db,
): Promise<void> {
  await database.transaction(async (tx) => {
    await lockGroupForFinancialMutation(tx, groupId);

    const [activeSettlement] = await tx
      .select({ id: settlements.id })
      .from(settlements)
      .where(
        and(
          eq(settlements.groupId, groupId),
          inArray(settlements.status, ["PENDING", "CONFIRMED"]),
        ),
      )
      .limit(1);

    if (activeSettlement) {
      throw new ExpenseDomainError(
        "EXPENSE_HAS_SETTLEMENTS",
        "Despesas não podem ser canceladas enquanto houver pagamentos pendentes ou confirmados no grupo.",
      );
    }

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
        cancelledAt: sql`now()`,
        cancelledBy: actorId,
      })
      .where(eq(expenses.id, expenseId));
  });
}

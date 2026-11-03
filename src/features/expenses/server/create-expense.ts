import { db } from "@/db";
import { expenseSplits, expenses } from "@/db/schema";
import type { Database } from "@/db/types";
import { calculateExpenseSplits } from "@/features/expenses/server/split-service";
import type { ExpenseSplitInput } from "@/features/expenses/types";
import {
  assertActiveGroupMembers,
  GroupAccessError,
  lockActiveGroupMembership,
} from "@/features/groups/server/group-access";

export type CreateExpenseInput = {
  groupId: string;
  actorId: string;
  paidBy: string;
  description: string;
  totalAmount: bigint;
  expenseDate: Date;
  split: ExpenseSplitInput;
};

export async function createExpense(
  input: CreateExpenseInput,
  database: Database = db,
): Promise<{ id: string }> {
  const shares = calculateExpenseSplits(input.totalAmount, input.split);
  const participantIds = shares.map((share) => share.userId);

  return database.transaction(async (tx) => {
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

    await assertActiveGroupMembers(tx, input.groupId, [
      input.paidBy,
      ...participantIds,
    ]);

    const [expense] = await tx
      .insert(expenses)
      .values({
        groupId: input.groupId,
        paidBy: input.paidBy,
        createdBy: input.actorId,
        description: input.description,
        totalAmount: input.totalAmount,
        splitMethod: input.split.method,
        expenseDate: input.expenseDate,
      })
      .returning({ id: expenses.id });

    await tx.insert(expenseSplits).values(
      shares.map((share) => ({
        expenseId: expense.id,
        userId: share.userId,
        shareAmount: share.shareAmount,
        percentage: share.percentage,
      })),
    );

    return { id: expense.id };
  });
}

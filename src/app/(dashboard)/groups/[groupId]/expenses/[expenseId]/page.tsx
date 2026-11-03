import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExpenseDetails } from "@/features/expenses/components/expense-details";
import { ExpenseDetailSkeleton } from "@/features/expenses/components/expense-skeleton";
import { getExpenseDetailForUser } from "@/features/expenses/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import {
  expenseGroupIdSchema,
  expenseIdSchema,
} from "@/lib/validation/expenses";

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const { groupId, expenseId } = await params;
  const parsedGroupId = expenseGroupIdSchema.safeParse(groupId);
  const parsedExpenseId = expenseIdSchema.safeParse(expenseId);

  if (!parsedGroupId.success || !parsedExpenseId.success) {
    notFound();
  }

  return (
    <Suspense fallback={<ExpenseDetailSkeleton />}>
      <ExpenseDetailLoader
        groupId={parsedGroupId.data}
        expenseId={parsedExpenseId.data}
      />
    </Suspense>
  );
}

async function ExpenseDetailLoader({
  groupId,
  expenseId,
}: {
  groupId: string;
  expenseId: string;
}) {
  const user = await requireUser();
  const expense = await getExpenseDetailForUser(groupId, expenseId, user.id);

  if (!expense) {
    notFound();
  }

  return <ExpenseDetails expense={expense} />;
}

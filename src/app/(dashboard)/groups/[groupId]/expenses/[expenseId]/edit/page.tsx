import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import { ExpenseDetailSkeleton } from "@/features/expenses/components/expense-skeleton";
import {
  getExpenseForEdit,
  getExpenseFormContext,
} from "@/features/expenses/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import {
  expenseGroupIdSchema,
  expenseIdSchema,
} from "@/lib/validation/expenses";

export const metadata: Metadata = {
  title: "Editar despesa",
};

export default async function EditExpensePage({
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
      <EditExpenseLoader
        groupId={parsedGroupId.data}
        expenseId={parsedExpenseId.data}
      />
    </Suspense>
  );
}

async function EditExpenseLoader({
  groupId,
  expenseId,
}: {
  groupId: string;
  expenseId: string;
}) {
  const user = await requireUser();
  const [context, initial] = await Promise.all([
    getExpenseFormContext(groupId, user.id),
    getExpenseForEdit(groupId, expenseId, user.id),
  ]);

  if (!context || !initial) {
    notFound();
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Editar despesa"
        description={`Atualize a despesa do grupo ${context.groupName}.`}
      />

      <Card>
        <CardContent className="p-6">
          <ExpenseForm
            mode="edit"
            context={context}
            defaultExpenseDate={initial.expenseDate}
            initial={initial}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

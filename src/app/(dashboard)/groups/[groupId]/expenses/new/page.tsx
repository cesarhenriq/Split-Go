import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import { ExpenseDetailSkeleton } from "@/features/expenses/components/expense-skeleton";
import { getExpenseFormContext } from "@/features/expenses/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import { expenseGroupIdSchema } from "@/lib/validation/expenses";

export const metadata: Metadata = {
  title: "Nova despesa",
};

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const parsedGroupId = expenseGroupIdSchema.safeParse(groupId);

  if (!parsedGroupId.success) {
    notFound();
  }

  return (
    <Suspense fallback={<ExpenseDetailSkeleton />}>
      <NewExpenseLoader groupId={parsedGroupId.data} />
    </Suspense>
  );
}

async function NewExpenseLoader({ groupId }: { groupId: string }) {
  const user = await requireUser();
  const context = await getExpenseFormContext(groupId, user.id);

  if (!context) {
    notFound();
  }

  const defaultExpenseDate = new Date().toISOString().slice(0, 10);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Nova despesa"
        description={`Registre uma despesa no grupo ${context.groupName}.`}
      />

      <Card>
        <CardContent className="p-6">
          <ExpenseForm
            mode="create"
            context={context}
            defaultExpenseDate={defaultExpenseDate}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

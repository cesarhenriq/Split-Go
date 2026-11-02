import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ExpensesEmptyState } from "@/features/expenses/components/expenses-empty-state";

export const metadata: Metadata = {
  title: "Despesas",
};

export default function ExpensesPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Despesas"
        description="O cadastro de despesas será habilitado quando os módulos de grupos e participantes estiverem prontos."
        action={
          <Button type="button" disabled>
            Nova despesa
          </Button>
        }
      />

      <ExpensesEmptyState />
    </PageContainer>
  );
}

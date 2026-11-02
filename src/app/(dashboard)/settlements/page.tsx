import type { Metadata } from "next";
import { SuccessFeedback } from "@/components/feedback/success-feedback";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SettlementsEmptyState } from "@/features/settlements/components/settlements-empty-state";

export const metadata: Metadata = {
  title: "Quitações",
};

export default function SettlementsPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Quitações"
        description="Acompanhe os acertos necessários entre os participantes dos grupos."
      />

      <SuccessFeedback
        title="Nenhuma pendência financeira"
        description="Quando existirem despesas com saldo a acertar, as quitações sugeridas aparecerão nesta página."
      />

      <SettlementsEmptyState />
    </PageContainer>
  );
}

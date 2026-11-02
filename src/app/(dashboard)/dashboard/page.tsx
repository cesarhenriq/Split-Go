import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { BalanceSummary } from "@/features/dashboard/components/balance-summary";
import { RecentActivity } from "@/features/dashboard/components/recent-activity";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Visão geral"
        description="Acompanhe seus saldos, grupos e as movimentações mais recentes."
        action={<Badge variant="secondary">Demonstração</Badge>}
      />

      <BalanceSummary />
      <RecentActivity />
    </PageContainer>
  );
}

import {
  ArrowRight,
  Clock3,
  FileText,
  Plus,
  Receipt,
  Scale,
} from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { SuccessFeedback } from "@/components/feedback/success-feedback";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MemberBalanceList } from "@/features/balances/components/member-balance-list";
import { SettlementPlan } from "@/features/balances/components/settlement-plan";
import { FinancialSummary } from "@/features/settlements/components/financial-summary";
import { SettlementStatusBadge } from "@/features/settlements/components/settlement-status-badge";
import { FinancialDashboardSkeleton } from "@/features/settlements/components/settlements-skeleton";
import { getFinancialDashboardForUser } from "@/features/settlements/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import { formatDate } from "@/lib/date";
import { FinanceIntegrityError } from "@/lib/finance/finance-errors";
import { formatCents } from "@/lib/money";
import { groupIdSchema } from "@/lib/validation/groups";

export const metadata: Metadata = {
  title: "Painel financeiro",
};

export default async function GroupFinancialDashboardPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const parsedGroupId = groupIdSchema.safeParse(groupId);

  if (!parsedGroupId.success) {
    notFound();
  }

  return (
    <Suspense fallback={<FinancialDashboardSkeleton />}>
      <FinancialDashboardLoader groupId={parsedGroupId.data} />
    </Suspense>
  );
}

async function FinancialDashboardLoader({ groupId }: { groupId: string }) {
  const user = await requireUser();

  let view: Awaited<ReturnType<typeof getFinancialDashboardForUser>>;

  try {
    view = await getFinancialDashboardForUser(groupId, user.id);
  } catch (error) {
    if (error instanceof FinanceIntegrityError) {
      console.error("Financial dashboard integrity error", error);

      return (
        <PageContainer className="space-y-6">
          <PageHeader
            title="Painel financeiro"
            description="Não foi possível calcular os saldos do grupo."
          />
          <ErrorState
            title="Dados financeiros inconsistentes"
            description="Os saldos não puderam ser calculados com segurança. Verifique as despesas e pagamentos do grupo ou tente novamente mais tarde."
          />
          <ButtonLink href={`/groups/${groupId}`} variant="outline">
            Voltar ao grupo
          </ButtonLink>
        </PageContainer>
      );
    }

    throw error;
  }

  if (!view) {
    notFound();
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Painel financeiro"
        description={`Resumo financeiro do grupo ${view.balances.groupName}.`}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <ButtonLink href={`/groups/${groupId}`} variant="outline" size="sm">
              Voltar ao grupo
            </ButtonLink>
            <ButtonLink
              href={`/groups/${groupId}/settlements/pending`}
              variant="outline"
              size="sm"
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              Pendentes
              {view.pendingCount > 0 ? ` (${view.pendingCount})` : ""}
            </ButtonLink>
            <ButtonLink
              href={`/groups/${groupId}/settlements`}
              variant="outline"
              size="sm"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Histórico
            </ButtonLink>
            <ButtonLink
              href={`/groups/${groupId}/statement`}
              variant="outline"
              size="sm"
            >
              Extrato
            </ButtonLink>
            <ButtonLink href={`/groups/${groupId}/settlements/new`} size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Registrar pagamento
            </ButtonLink>
          </div>
        }
      />

      <FinancialSummary view={view} />

      {view.financialStatus === "balanced" && (
        <SuccessFeedback
          title="Grupo totalmente equilibrado"
          description="Todas as despesas foram quitadas com pagamentos confirmados. Não há transferências pendentes."
        />
      )}

      {view.financialStatus === "pending" && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-body text-warning-800">
          Existem pagamentos aguardando confirmação. Eles ainda não alteram os
          saldos confirmados e não devem ser considerados quitação.
        </div>
      )}

      {view.financialStatus === "partial" && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-body text-primary-800">
          O grupo está parcialmente quitado. Pagamentos confirmados já foram
          contabilizados, mas ainda existem saldos a acertar.
        </div>
      )}

      {view.financialStatus === "open" && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-body text-warning-800">
          O grupo possui pendências financeiras. Utilize o plano sugerido para
          registrar os pagamentos necessários.
        </div>
      )}

      {view.pendingSettlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-warning-600" aria-hidden="true" />
              Aguardando confirmação
            </CardTitle>
            <CardDescription>
              Pagamentos registrados que ainda não foram confirmados pelos
              destinatários.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="divide-y divide-border">
              {view.pendingSettlements.slice(0, 5).map((settlement) => (
                <li
                  key={settlement.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-medium">{settlement.paidByName}</span>
                    <ArrowRight
                      className="h-4 w-4 text-neutral-400"
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      {settlement.receivedByName}
                    </span>
                    <SettlementStatusBadge status={settlement.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {formatCents(settlement.amount)}
                    </span>
                    <span className="text-meta text-neutral-500">
                      {formatDate(settlement.createdAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <ButtonLink
              href={`/groups/${groupId}/settlements/pending`}
              variant="outline"
              size="sm"
            >
              Ver todos os pendentes
            </ButtonLink>
          </CardContent>
        </Card>
      )}

      {view.balances.totalExpenses === 0n ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma despesa registrada"
          description="Registre despesas no grupo para que os saldos, o plano de pagamentos e o painel financeiro sejam calculados."
          action={
            <ButtonLink href={`/groups/${groupId}/expenses/new`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova despesa
            </ButtonLink>
          }
        />
      ) : (
        <>
          <MemberBalanceList members={view.balances.members} />
          <SettlementPlan
            suggestions={view.balances.suggestions}
            totalSuggested={view.balances.totalSuggested}
            groupId={groupId}
            currentUserId={user.id}
            activeUserIds={view.balances.members
              .filter((member) => member.isActiveMember)
              .map((member) => member.userId)}
          />
          <div>
            <ButtonLink
              href={`/groups/${groupId}/balances`}
              variant="outline"
              size="sm"
            >
              <Scale className="h-4 w-4" aria-hidden="true" />
              Ver visão detalhada de saldos
            </ButtonLink>
          </div>
        </>
      )}
    </PageContainer>
  );
}

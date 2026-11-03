import { Receipt } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { BalancesSkeleton } from "@/features/balances/components/balances-skeleton";
import { GroupBalanceSummary } from "@/features/balances/components/group-balance-summary";
import { MemberBalanceList } from "@/features/balances/components/member-balance-list";
import { SettlementPlan } from "@/features/balances/components/settlement-plan";
import { getGroupBalancesForUser } from "@/features/balances/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import { FinanceIntegrityError } from "@/lib/finance/finance-errors";
import { groupIdSchema } from "@/lib/validation/groups";

export const metadata: Metadata = {
  title: "Saldos",
};

export default async function GroupBalancesPage({
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
    <Suspense fallback={<BalancesSkeleton />}>
      <GroupBalancesLoader groupId={parsedGroupId.data} />
    </Suspense>
  );
}

async function GroupBalancesLoader({ groupId }: { groupId: string }) {
  const user = await requireUser();

  let view: Awaited<ReturnType<typeof getGroupBalancesForUser>>;

  try {
    view = await getGroupBalancesForUser(groupId, user.id);
  } catch (error) {
    if (error instanceof FinanceIntegrityError) {
      console.error("Group balances integrity error", error);

      return (
        <PageContainer className="space-y-6">
          <PageHeader
            title="Saldos"
            description="Não foi possível calcular os saldos do grupo."
          />
          <ErrorState
            title="Dados financeiros inconsistentes"
            description="Os saldos não puderam ser calculados com segurança. Verifique as despesas e rateios do grupo ou tente novamente mais tarde."
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
        title="Saldos"
        description={`Saldos calculados a partir das despesas válidas do grupo ${view.groupName}.`}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <ButtonLink href={`/groups/${groupId}`} variant="outline" size="sm">
              Voltar ao grupo
            </ButtonLink>
            <ButtonLink
              href={`/groups/${groupId}/expenses`}
              variant="outline"
              size="sm"
            >
              Ver despesas
            </ButtonLink>
          </div>
        }
      />

      {view.totalExpenses === 0n ? (
        <EmptyState
          icon={Receipt}
          title="Nenhuma despesa registrada"
          description="Registre despesas no grupo para que os saldos e o plano de pagamentos sejam calculados."
          action={
            <ButtonLink href={`/groups/${groupId}/expenses/new`}>
              Nova despesa
            </ButtonLink>
          }
        />
      ) : (
        <>
          <GroupBalanceSummary view={view} />
          <MemberBalanceList members={view.members} />
          <SettlementPlan
            suggestions={view.suggestions}
            totalSuggested={view.totalSuggested}
            groupId={groupId}
            currentUserId={user.id}
            activeUserIds={view.members
              .filter((member) => member.isActiveMember)
              .map((member) => member.userId)}
          />
        </>
      )}
    </PageContainer>
  );
}

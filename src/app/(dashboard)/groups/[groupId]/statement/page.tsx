import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ErrorState } from "@/components/feedback/error-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { IndividualStatement } from "@/features/settlements/components/individual-statement";
import { StatementSkeleton } from "@/features/settlements/components/settlements-skeleton";
import { StatementFilters } from "@/features/settlements/components/statement-filters";
import { getIndividualStatement } from "@/features/settlements/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import { FinanceIntegrityError } from "@/lib/finance/finance-errors";
import { groupIdSchema } from "@/lib/validation/groups";
import {
  type StatementFilters as StatementFiltersValue,
  statementFiltersSchema,
} from "@/lib/validation/settlements";

export const metadata: Metadata = {
  title: "Extrato individual",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(searchParams: SearchParams): StatementFiltersValue {
  const parsed = statementFiltersSchema.safeParse({
    from: first(searchParams.from) ?? "",
    to: first(searchParams.to) ?? "",
    type: first(searchParams.type) ?? "all",
    status: first(searchParams.status) ?? "all",
  });

  return parsed.success ? parsed.data : statementFiltersSchema.parse({});
}

export default async function GroupStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { groupId } = await params;
  const parsedGroupId = groupIdSchema.safeParse(groupId);

  if (!parsedGroupId.success) {
    notFound();
  }

  return (
    <Suspense fallback={<StatementSkeleton />}>
      <StatementLoader
        groupId={parsedGroupId.data}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

async function StatementLoader({
  groupId,
  searchParams,
}: {
  groupId: string;
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const filters = parseFilters(await searchParams);

  let view: Awaited<ReturnType<typeof getIndividualStatement>>;

  try {
    view = await getIndividualStatement(groupId, user.id, filters);
  } catch (error) {
    if (error instanceof FinanceIntegrityError) {
      console.error("Individual statement integrity error", error);

      return (
        <PageContainer className="space-y-6">
          <PageHeader
            title="Extrato individual"
            description="Não foi possível calcular o extrato do grupo."
          />
          <ErrorState
            title="Dados financeiros inconsistentes"
            description="O extrato não pôde ser calculado com segurança. Verifique as despesas e pagamentos do grupo ou tente novamente mais tarde."
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
        title="Extrato individual"
        description={`Movimentações de ${view.memberName} no grupo ${view.groupName}.`}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <ButtonLink
              href={`/groups/${groupId}/dashboard`}
              variant="outline"
              size="sm"
            >
              Painel financeiro
            </ButtonLink>
            <ButtonLink
              href={`/groups/${groupId}/settlements`}
              variant="outline"
              size="sm"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Histórico
            </ButtonLink>
          </div>
        }
      />

      <StatementFilters groupId={groupId} filters={filters} />

      <IndividualStatement groupId={groupId} view={view} filters={filters} />
    </PageContainer>
  );
}

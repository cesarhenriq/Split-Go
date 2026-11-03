import { Plus, Receipt, Scale } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { ExpenseFiltersForm } from "@/features/expenses/components/expense-filters";
import { ExpenseList } from "@/features/expenses/components/expense-list";
import { ExpensePagination } from "@/features/expenses/components/expense-pagination";
import { ExpenseListSkeleton } from "@/features/expenses/components/expense-skeleton";
import {
  getExpenseFormContext,
  listGroupExpenses,
} from "@/features/expenses/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import {
  expenseFiltersSchema,
  expenseGroupIdSchema,
} from "@/lib/validation/expenses";

export const metadata: Metadata = {
  title: "Despesas",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilters(searchParams: SearchParams) {
  const parsed = expenseFiltersSchema.safeParse({
    description: first(searchParams.description) ?? "",
    from: first(searchParams.from) ?? "",
    to: first(searchParams.to) ?? "",
    paidBy: first(searchParams.paidBy) ?? "",
    includeCancelled: first(searchParams.includeCancelled),
    page: first(searchParams.page) ?? "1",
  });

  return parsed.success ? parsed.data : expenseFiltersSchema.parse({});
}

export default async function GroupExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { groupId } = await params;
  const parsedGroupId = expenseGroupIdSchema.safeParse(groupId);

  if (!parsedGroupId.success) {
    notFound();
  }

  return (
    <Suspense fallback={<ExpenseListSkeleton />}>
      <GroupExpensesLoader
        groupId={parsedGroupId.data}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

async function GroupExpensesLoader({
  groupId,
  searchParams,
}: {
  groupId: string;
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const filters = parseFilters(await searchParams);
  const [context, result] = await Promise.all([
    getExpenseFormContext(groupId, user.id),
    listGroupExpenses(groupId, user.id, filters),
  ]);

  if (!context || !result) {
    notFound();
  }

  const hasFilters = Boolean(
    filters.description ||
      filters.from ||
      filters.to ||
      filters.paidBy ||
      filters.includeCancelled,
  );

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Despesas"
        description={`Despesas compartilhadas do grupo ${context.groupName}.`}
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <ButtonLink href={`/groups/${groupId}`} variant="outline" size="sm">
              Voltar ao grupo
            </ButtonLink>
            <ButtonLink
              href={`/groups/${groupId}/balances`}
              variant="outline"
              size="sm"
            >
              <Scale className="h-4 w-4" aria-hidden="true" />
              Saldos
            </ButtonLink>
            <ButtonLink href={`/groups/${groupId}/expenses/new`} size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova despesa
            </ButtonLink>
          </div>
        }
      />

      <ExpenseFiltersForm
        groupId={groupId}
        members={context.members}
        filters={filters}
      />

      {result.total === 0 ? (
        <EmptyState
          icon={Receipt}
          title={
            hasFilters
              ? "Nenhuma despesa encontrada"
              : "Nenhuma despesa registrada"
          }
          description={
            hasFilters
              ? "Tente ajustar ou limpar os filtros aplicados."
              : "Registre a primeira despesa do grupo para começar a dividir os valores."
          }
          action={
            hasFilters ? (
              <ButtonLink
                href={`/groups/${groupId}/expenses`}
                variant="outline"
              >
                Limpar filtros
              </ButtonLink>
            ) : (
              <ButtonLink href={`/groups/${groupId}/expenses/new`}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova despesa
              </ButtonLink>
            )
          }
        />
      ) : (
        <>
          <ExpenseList expenses={result.items} />
          <ExpensePagination
            groupId={groupId}
            filters={filters}
            page={result.page}
            totalPages={result.totalPages}
          />
        </>
      )}
    </PageContainer>
  );
}

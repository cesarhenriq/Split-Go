import { Clock3, Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { SettlementHistory } from "@/features/settlements/components/settlement-history";
import { SettlementsListSkeleton } from "@/features/settlements/components/settlements-skeleton";
import { listSettlementsForGroup } from "@/features/settlements/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import { groupIdSchema } from "@/lib/validation/groups";
import { settlementStatusFilterSchema } from "@/lib/validation/settlements";

export const metadata: Metadata = {
  title: "Histórico de pagamentos",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GroupSettlementsPage({
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
    <Suspense fallback={<SettlementsListSkeleton />}>
      <SettlementsLoader
        groupId={parsedGroupId.data}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

async function SettlementsLoader({
  groupId,
  searchParams,
}: {
  groupId: string;
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const parsedStatus = settlementStatusFilterSchema.safeParse(
    first(params.status),
  );
  const status = parsedStatus.success ? parsedStatus.data : "all";
  const settlements = await listSettlementsForGroup(groupId, user.id, status);

  if (!settlements) {
    notFound();
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Histórico de pagamentos"
        description="Pagamentos registrados entre os integrantes do grupo."
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
              href={`/groups/${groupId}/settlements/pending`}
              variant="outline"
              size="sm"
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              Pendentes
            </ButtonLink>
            <ButtonLink href={`/groups/${groupId}/settlements/new`} size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Registrar pagamento
            </ButtonLink>
          </div>
        }
      />

      <SettlementHistory
        groupId={groupId}
        settlements={settlements}
        status={status}
      />
    </PageContainer>
  );
}

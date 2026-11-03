import { FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { PendingSettlementsList } from "@/features/settlements/components/pending-settlements-list";
import { SettlementsListSkeleton } from "@/features/settlements/components/settlements-skeleton";
import { listSettlementsForGroup } from "@/features/settlements/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import { groupIdSchema } from "@/lib/validation/groups";

export const metadata: Metadata = {
  title: "Pagamentos pendentes",
};

export default async function PendingSettlementsPage({
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
    <Suspense fallback={<SettlementsListSkeleton />}>
      <PendingSettlementsLoader groupId={parsedGroupId.data} />
    </Suspense>
  );
}

async function PendingSettlementsLoader({ groupId }: { groupId: string }) {
  const user = await requireUser();
  const settlements = await listSettlementsForGroup(
    groupId,
    user.id,
    "PENDING",
  );

  if (!settlements) {
    notFound();
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Pagamentos pendentes"
        description="Confirme os pagamentos que você recebeu ou acompanhe os que aguardam confirmação."
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
            <ButtonLink href={`/groups/${groupId}/settlements/new`} size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Registrar pagamento
            </ButtonLink>
          </div>
        }
      />

      <PendingSettlementsList
        groupId={groupId}
        settlements={settlements}
        currentUserId={user.id}
      />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SettlementDetails } from "@/features/settlements/components/settlement-details";
import { SettlementDetailSkeleton } from "@/features/settlements/components/settlements-skeleton";
import { getSettlementDetailForUser } from "@/features/settlements/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import { groupIdSchema } from "@/lib/validation/groups";
import { settlementIdSchema } from "@/lib/validation/settlements";

export const metadata: Metadata = {
  title: "Detalhes do pagamento",
};

export default async function SettlementDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; settlementId: string }>;
}) {
  const { groupId, settlementId } = await params;
  const parsedGroupId = groupIdSchema.safeParse(groupId);
  const parsedSettlementId = settlementIdSchema.safeParse(settlementId);

  if (!parsedGroupId.success || !parsedSettlementId.success) {
    notFound();
  }

  return (
    <Suspense fallback={<SettlementDetailSkeleton />}>
      <SettlementDetailLoader
        groupId={parsedGroupId.data}
        settlementId={parsedSettlementId.data}
      />
    </Suspense>
  );
}

async function SettlementDetailLoader({
  groupId,
  settlementId,
}: {
  groupId: string;
  settlementId: string;
}) {
  const user = await requireUser();
  const settlement = await getSettlementDetailForUser(
    groupId,
    settlementId,
    user.id,
  );

  if (!settlement) {
    notFound();
  }

  return <SettlementDetails settlement={settlement} />;
}

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GroupDetailContent } from "@/features/groups/components/group-detail-content";
import { GroupDetailSkeleton } from "@/features/groups/components/group-detail-skeleton";
import { getGroupDetailForUser } from "@/features/groups/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import { groupIdSchema } from "@/lib/validation/groups";

export default async function GroupDetailPage({
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
    <Suspense fallback={<GroupDetailSkeleton />}>
      <GroupDetailLoader groupId={parsedGroupId.data} />
    </Suspense>
  );
}

async function GroupDetailLoader({ groupId }: { groupId: string }) {
  const user = await requireUser();
  const group = await getGroupDetailForUser(groupId, user.id);

  if (!group) {
    notFound();
  }

  return <GroupDetailContent group={group} />;
}

import { GroupsEmptyState } from "@/features/groups/components/groups-empty-state";
import { GroupsList } from "@/features/groups/components/groups-list";
import { listGroupsForUser } from "@/features/groups/server/queries";
import { requireUser } from "@/lib/auth/current-user";

export async function GroupsPageContent() {
  const user = await requireUser();
  const groups = await listGroupsForUser(user.id);

  if (groups.length === 0) {
    return <GroupsEmptyState />;
  }

  return <GroupsList groups={groups} />;
}

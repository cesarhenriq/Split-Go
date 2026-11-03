import { GroupCard } from "@/features/groups/components/group-card";
import type { GroupSummary } from "@/features/groups/types";

export function GroupsList({ groups }: { groups: GroupSummary[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

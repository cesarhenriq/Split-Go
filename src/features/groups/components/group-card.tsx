import { CalendarDays, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { GroupSummary } from "@/features/groups/types";
import { formatDate } from "@/lib/date";

export function GroupCard({ group }: { group: GroupSummary }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        {group.description && (
          <CardDescription className="line-clamp-2">
            {group.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="mt-auto space-y-4">
        <dl className="space-y-2 text-meta text-neutral-500">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            <dd>
              {group.memberCount}{" "}
              {group.memberCount === 1 ? "integrante" : "integrantes"}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-600">Admin:</span>
            <dd className="truncate">{group.creatorName}</dd>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            <dd>Criado em {formatDate(group.createdAt)}</dd>
          </div>
        </dl>

        <ButtonLink
          href={`/groups/${group.id}`}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Ver detalhes
        </ButtonLink>
      </CardContent>
    </Card>
  );
}

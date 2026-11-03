import { Mail } from "lucide-react";
import { CancelInvitationButton } from "@/features/groups/components/cancel-invitation-button";
import type { PendingInvitationSummary } from "@/features/groups/types";
import { formatDate } from "@/lib/date";

export type PendingInvitationsListProps = {
  groupId: string;
  invitations: PendingInvitationSummary[];
};

export function PendingInvitationsList({
  groupId,
  invitations,
}: PendingInvitationsListProps) {
  if (invitations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center">
        <Mail className="mx-auto h-5 w-5 text-neutral-400" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium">Nenhum convite pendente</p>
        <p className="mt-1 text-meta text-neutral-500">
          Os convites enviados aparecerão aqui até serem respondidos.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {invitations.map((invitation) => (
        <li
          key={invitation.id}
          className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{invitation.email}</p>
            <p className="text-meta text-neutral-500">
              Enviado em {formatDate(invitation.createdAt)} · expira em{" "}
              {formatDate(invitation.expiresAt)}
            </p>
          </div>
          <CancelInvitationButton
            groupId={groupId}
            invitationId={invitation.id}
            email={invitation.email}
          />
        </li>
      ))}
    </ul>
  );
}

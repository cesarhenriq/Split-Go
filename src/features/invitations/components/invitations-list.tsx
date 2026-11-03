import { Mail } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import type { ReceivedInvitation } from "@/features/groups/types";
import { InvitationCard } from "@/features/invitations/components/invitation-card";

export function InvitationsList({
  invitations,
}: {
  invitations: ReceivedInvitation[];
}) {
  if (invitations.length === 0) {
    return (
      <EmptyState
        icon={Mail}
        title="Nenhum convite recebido"
        description="Quando alguém convidar o e-mail da sua conta para um grupo, o convite aparecerá aqui."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {invitations.map((invitation) => (
        <InvitationCard key={invitation.id} invitation={invitation} />
      ))}
    </div>
  );
}

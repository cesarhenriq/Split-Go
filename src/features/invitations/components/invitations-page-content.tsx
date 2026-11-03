import { listReceivedInvitations } from "@/features/groups/server/queries";
import { InvitationsList } from "@/features/invitations/components/invitations-list";
import { requireUser } from "@/lib/auth/current-user";

export async function InvitationsPageContent() {
  const user = await requireUser();
  const invitations = await listReceivedInvitations(user.email);

  return <InvitationsList invitations={invitations} />;
}

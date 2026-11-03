import { CalendarDays, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  InvitationStatus,
  ReceivedInvitation,
} from "@/features/groups/types";
import { InvitationActions } from "@/features/invitations/components/invitation-actions";
import { formatDate } from "@/lib/date";

const statusLabels: Record<InvitationStatus, string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  DECLINED: "Recusado",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
};

const statusVariants: Record<
  InvitationStatus,
  "warning" | "success" | "danger" | "secondary"
> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "danger",
  EXPIRED: "secondary",
  CANCELLED: "secondary",
};

export function InvitationCard({
  invitation,
}: {
  invitation: ReceivedInvitation;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>{invitation.groupName}</CardTitle>
          <p className="text-body text-neutral-500">
            Convite enviado por {invitation.inviterName}
          </p>
        </div>
        <Badge variant={statusVariants[invitation.displayStatus]}>
          {statusLabels[invitation.displayStatus]}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <dl className="grid gap-2 text-meta text-neutral-500 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">{invitation.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>Convite para participar do grupo</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Recebido em {formatDate(invitation.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Expira em {formatDate(invitation.expiresAt)}</span>
          </div>
        </dl>

        {invitation.canRespond && (
          <InvitationActions invitationId={invitation.id} />
        )}
      </CardContent>
    </Card>
  );
}

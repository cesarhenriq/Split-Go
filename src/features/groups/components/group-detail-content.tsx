import {
  CalendarDays,
  Crown,
  Mail,
  Receipt,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditGroupDialog } from "@/features/groups/components/edit-group-dialog";
import { InviteMembersDialog } from "@/features/groups/components/invite-members-dialog";
import { LeaveGroupButton } from "@/features/groups/components/leave-group-button";
import { MemberRowActions } from "@/features/groups/components/member-row-actions";
import { PendingInvitationsList } from "@/features/groups/components/pending-invitations-list";
import type { GroupDetail } from "@/features/groups/types";
import { formatDate } from "@/lib/date";
import { getInitials } from "@/lib/user";

export function GroupDetailContent({ group }: { group: GroupDetail }) {
  const isAdmin = group.currentUserRole === "ADMIN";

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={group.name}
        description={
          group.description ?? "Este grupo ainda não possui descrição."
        }
        action={
          <div className="flex flex-wrap items-start justify-end gap-2">
            <ButtonLink href={`/groups/${group.id}/balances`} variant="outline">
              <Scale className="h-4 w-4" aria-hidden="true" />
              Saldos
            </ButtonLink>
            <ButtonLink href={`/groups/${group.id}/expenses`} variant="outline">
              <Receipt className="h-4 w-4" aria-hidden="true" />
              Despesas
            </ButtonLink>
            {isAdmin && <EditGroupDialog group={group} />}
            {isAdmin && <InviteMembersDialog groupId={group.id} />}
            <LeaveGroupButton groupId={group.id} isAdmin={isAdmin} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Crown className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <div>
              <p className="text-meta text-neutral-500">Criador</p>
              <p className="text-sm font-medium">{group.creatorName}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <CalendarDays
              className="h-5 w-5 text-primary-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-meta text-neutral-500">Criado em</p>
              <p className="text-sm font-medium">
                {formatDate(group.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <ShieldCheck
              className="h-5 w-5 text-primary-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-meta text-neutral-500">Seu papel</p>
              <p className="text-sm font-medium">
                {isAdmin ? "Administrador" : "Integrante"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Integrantes
          </CardTitle>
          <CardDescription>
            {group.members.length}{" "}
            {group.members.length === 1
              ? "integrante ativo"
              : "integrantes ativos"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {group.members.map((member) => {
              const canManage =
                isAdmin &&
                member.userId !== group.currentUserId &&
                member.role !== "ADMIN";

              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      fallback={getInitials(member.name)}
                      alt={member.name}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {member.name}
                        </p>
                        {member.userId === group.currentUserId && (
                          <Badge variant="secondary">Você</Badge>
                        )}
                        {member.role === "ADMIN" && (
                          <Badge variant="default">Admin</Badge>
                        )}
                      </div>
                      <p className="truncate text-meta text-neutral-500">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <p className="text-meta text-neutral-500">
                      Entrou em {formatDate(member.joinedAt)}
                    </p>
                    {canManage && (
                      <MemberRowActions groupId={group.id} member={member} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary-600" aria-hidden="true" />
              Convites pendentes
            </CardTitle>
            <CardDescription>
              Convites aguardando resposta. E-mails ainda não são enviados
              automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PendingInvitationsList
              groupId={group.id}
              invitations={group.pendingInvitations}
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

import { and, eq, gt, isNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { groupInvitations, groupMembers, groups, users } from "@/db/schema";
import type { Database, DatabaseTransaction } from "@/db/types";
import { GroupDomainError } from "@/features/groups/server/errors";
import {
  GroupAccessError,
  requireGroupAdminForUpdate,
} from "@/features/groups/server/group-access";
import {
  type InvitationNotifier,
  unavailableInvitationNotifier,
} from "@/features/groups/server/invitation-notifier";
import {
  generateInvitationToken,
  hashInvitationToken,
  INVITATION_TTL_MS,
} from "@/features/groups/server/invitation-token";
import type { InviteDelivery, InviteResult } from "@/features/groups/types";
import { isPostgresUniqueViolation } from "@/lib/db/errors";

export type InviteMembersInput = {
  groupId: string;
  actorId: string;
  actorEmail: string;
  emails: string[];
};

async function expireOverdueInvitations(
  tx: DatabaseTransaction,
  groupId: string,
  email: string,
) {
  await tx
    .update(groupInvitations)
    .set({ status: "EXPIRED" })
    .where(
      and(
        eq(groupInvitations.groupId, groupId),
        eq(groupInvitations.email, email),
        eq(groupInvitations.status, "PENDING"),
        lte(groupInvitations.expiresAt, new Date()),
      ),
    );
}

export async function inviteMembers(
  input: InviteMembersInput,
  database: Database = db,
  notifier: InvitationNotifier = unavailableInvitationNotifier,
): Promise<InviteResult[]> {
  const [group] = await database
    .select({ name: groups.name })
    .from(groups)
    .where(eq(groups.id, input.groupId))
    .limit(1);

  if (!group) {
    throw new GroupDomainError("GROUP_NOT_FOUND", "Grupo não encontrado.");
  }

  const [inviter] = await database
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, input.actorId))
    .limit(1);

  if (!inviter) {
    throw new GroupDomainError("GROUP_NOT_FOUND", "Usuário não encontrado.");
  }

  const results: InviteResult[] = [];
  const emails = [...new Set(input.emails)];

  for (const email of emails) {
    if (email === input.actorEmail) {
      results.push({
        email,
        status: "self",
        message: "Você não pode convidar o seu próprio e-mail.",
        delivery: "not-configured",
      });
      continue;
    }

    try {
      const invitation = await database.transaction(async (tx) => {
        await requireGroupAdminForUpdate(tx, input.groupId, input.actorId);
        await expireOverdueInvitations(tx, input.groupId, email);

        const [member] = await tx
          .select({ id: groupMembers.id })
          .from(groupMembers)
          .innerJoin(users, eq(users.id, groupMembers.userId))
          .where(
            and(
              eq(groupMembers.groupId, input.groupId),
              eq(users.email, email),
              eq(groupMembers.status, "ACCEPTED"),
              isNull(groupMembers.leftAt),
            ),
          )
          .limit(1);

        if (member) {
          return { status: "already-member" as const };
        }

        const [pending] = await tx
          .select({ id: groupInvitations.id })
          .from(groupInvitations)
          .where(
            and(
              eq(groupInvitations.groupId, input.groupId),
              eq(groupInvitations.email, email),
              eq(groupInvitations.status, "PENDING"),
              gt(groupInvitations.expiresAt, new Date()),
            ),
          )
          .limit(1);

        if (pending) {
          return { status: "pending" as const };
        }

        const token = generateInvitationToken();
        const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

        await tx.insert(groupInvitations).values({
          groupId: input.groupId,
          email,
          invitedBy: input.actorId,
          tokenHash: hashInvitationToken(token),
          expiresAt,
        });

        return { status: "created" as const, token, expiresAt };
      });

      if (invitation.status === "already-member") {
        results.push({
          email,
          status: "already-member",
          message: "Este e-mail já pertence a um integrante do grupo.",
          delivery: "not-configured",
        });
        continue;
      }

      if (invitation.status === "pending") {
        results.push({
          email,
          status: "pending",
          message: "Já existe um convite pendente para este e-mail.",
          delivery: "not-configured",
        });
        continue;
      }

      let delivery: InviteDelivery = "not-configured";

      try {
        delivery = await notifier.sendInvitation({
          to: email,
          groupName: group.name,
          inviterName: inviter.name,
          token: invitation.token,
          expiresAt: invitation.expiresAt,
        });
      } catch (error) {
        console.error("invitation notifier failed", error);
        delivery = "failed";
      }

      results.push({
        email,
        status: "created",
        message:
          delivery === "not-configured"
            ? "Convite registrado. O envio por e-mail não está configurado."
            : delivery === "sent"
              ? "Convite enviado."
              : "Convite registrado, mas o envio falhou.",
        delivery,
      });
    } catch (error) {
      if (
        isPostgresUniqueViolation(
          error,
          "group_invitations_pending_group_email_unique",
        )
      ) {
        results.push({
          email,
          status: "pending",
          message: "Já existe um convite pendente para este e-mail.",
          delivery: "not-configured",
        });
        continue;
      }

      if (
        error instanceof GroupAccessError ||
        error instanceof GroupDomainError
      ) {
        throw error;
      }

      console.error("inviteMembers failed", { email, error });
      results.push({
        email,
        status: "error",
        message: "Não foi possível criar o convite.",
        delivery: "failed",
      });
    }
  }

  return results;
}

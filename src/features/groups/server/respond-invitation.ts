import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { groupInvitations, groupMembers } from "@/db/schema";
import type { Database } from "@/db/types";

export type InvitationResponseResult =
  | {
      ok: true;
      decision: "ACCEPTED" | "DECLINED";
      groupId: string;
    }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "EMAIL_MISMATCH"
        | "NOT_PENDING"
        | "EXPIRED"
        | "ALREADY_MEMBER";
    };

export type RespondToInvitationInput = {
  invitationId: string;
  userId: string;
  userEmail: string;
  decision: "accept" | "decline";
};

export async function respondToInvitation(
  input: RespondToInvitationInput,
  database: Database = db,
): Promise<InvitationResponseResult> {
  return database.transaction(async (tx) => {
    const now = new Date();
    const [invitation] = await tx
      .select({
        id: groupInvitations.id,
        groupId: groupInvitations.groupId,
        email: groupInvitations.email,
        status: groupInvitations.status,
        expiresAt: groupInvitations.expiresAt,
      })
      .from(groupInvitations)
      .where(eq(groupInvitations.id, input.invitationId))
      .limit(1)
      .for("update");

    if (!invitation) {
      return { ok: false, code: "NOT_FOUND" };
    }

    if (invitation.email !== input.userEmail) {
      return { ok: false, code: "EMAIL_MISMATCH" };
    }

    if (invitation.status !== "PENDING") {
      return { ok: false, code: "NOT_PENDING" };
    }

    if (invitation.expiresAt <= now) {
      await tx
        .update(groupInvitations)
        .set({ status: "EXPIRED" })
        .where(eq(groupInvitations.id, invitation.id));

      return { ok: false, code: "EXPIRED" };
    }

    if (input.decision === "decline") {
      await tx
        .update(groupInvitations)
        .set({
          status: "DECLINED",
          respondedAt: sql`now()`,
        })
        .where(eq(groupInvitations.id, invitation.id));

      return {
        ok: true,
        decision: "DECLINED",
        groupId: invitation.groupId,
      };
    }

    const [existingMembership] = await tx
      .select({
        id: groupMembers.id,
        status: groupMembers.status,
        leftAt: groupMembers.leftAt,
      })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, invitation.groupId),
          eq(groupMembers.userId, input.userId),
        ),
      )
      .limit(1)
      .for("update");

    if (
      existingMembership &&
      existingMembership.status === "ACCEPTED" &&
      existingMembership.leftAt === null
    ) {
      return { ok: false, code: "ALREADY_MEMBER" };
    }

    if (existingMembership) {
      await tx
        .update(groupMembers)
        .set({
          role: "MEMBER",
          status: "ACCEPTED",
          joinedAt: sql`now()`,
          leftAt: null,
        })
        .where(eq(groupMembers.id, existingMembership.id));
    } else {
      await tx.insert(groupMembers).values({
        groupId: invitation.groupId,
        userId: input.userId,
        role: "MEMBER",
        status: "ACCEPTED",
        joinedAt: sql`now()`,
      });
    }

    await tx
      .update(groupInvitations)
      .set({
        status: "ACCEPTED",
        respondedAt: sql`now()`,
      })
      .where(
        and(
          eq(groupInvitations.id, invitation.id),
          eq(groupInvitations.status, "PENDING"),
          isNull(groupInvitations.respondedAt),
        ),
      );

    return {
      ok: true,
      decision: "ACCEPTED",
      groupId: invitation.groupId,
    };
  });
}

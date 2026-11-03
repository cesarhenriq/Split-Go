import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { groupInvitations } from "@/db/schema";
import type { Database } from "@/db/types";
import { requireGroupAdminForUpdate } from "@/features/groups/server/group-access";

export type CancelInvitationResult =
  | { ok: true }
  | {
      ok: false;
      code: "NOT_FOUND" | "NOT_PENDING" | "EXPIRED";
    };

export async function cancelInvitation(
  groupId: string,
  invitationId: string,
  actorId: string,
  database: Database = db,
): Promise<CancelInvitationResult> {
  return database.transaction(async (tx) => {
    await requireGroupAdminForUpdate(tx, groupId, actorId);

    const [invitation] = await tx
      .select({
        id: groupInvitations.id,
        status: groupInvitations.status,
        expiresAt: groupInvitations.expiresAt,
      })
      .from(groupInvitations)
      .where(
        and(
          eq(groupInvitations.id, invitationId),
          eq(groupInvitations.groupId, groupId),
        ),
      )
      .limit(1)
      .for("update");

    if (!invitation) {
      return { ok: false, code: "NOT_FOUND" };
    }

    if (invitation.status !== "PENDING") {
      return { ok: false, code: "NOT_PENDING" };
    }

    if (invitation.expiresAt <= new Date()) {
      await tx
        .update(groupInvitations)
        .set({ status: "EXPIRED" })
        .where(eq(groupInvitations.id, invitation.id));

      return { ok: false, code: "EXPIRED" };
    }

    await tx
      .update(groupInvitations)
      .set({ status: "CANCELLED" })
      .where(eq(groupInvitations.id, invitation.id));

    return { ok: true };
  });
}

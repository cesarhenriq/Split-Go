import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import type { Database } from "@/db/types";
import { GroupDomainError } from "@/features/groups/server/errors";
import { requireGroupAdminForUpdate } from "@/features/groups/server/group-access";

export async function promoteGroupMember(
  groupId: string,
  actorId: string,
  targetUserId: string,
  database: Database = db,
): Promise<void> {
  await database.transaction(async (tx) => {
    await requireGroupAdminForUpdate(tx, groupId, actorId);

    if (actorId === targetUserId) {
      throw new GroupDomainError(
        "ALREADY_ADMIN",
        "Você já é administrador deste grupo.",
      );
    }

    const [target] = await tx
      .select({
        id: groupMembers.id,
        role: groupMembers.role,
      })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId),
          eq(groupMembers.status, "ACCEPTED"),
          isNull(groupMembers.leftAt),
        ),
      )
      .limit(1)
      .for("update");

    if (!target) {
      throw new GroupDomainError(
        "TARGET_NOT_MEMBER",
        "Este usuário não é um integrante ativo do grupo.",
      );
    }

    if (target.role === "ADMIN") {
      throw new GroupDomainError(
        "ALREADY_ADMIN",
        "Este integrante já é administrador.",
      );
    }

    await tx
      .update(groupMembers)
      .set({ role: "ADMIN" })
      .where(eq(groupMembers.id, target.id));
  });
}

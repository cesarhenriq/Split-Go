import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import type { Database } from "@/db/types";
import { GroupDomainError } from "@/features/groups/server/errors";
import { requireGroupAdminForUpdate } from "@/features/groups/server/group-access";

export async function removeGroupMember(
  groupId: string,
  actorId: string,
  targetUserId: string,
  database: Database = db,
): Promise<void> {
  await database.transaction(async (tx) => {
    await requireGroupAdminForUpdate(tx, groupId, actorId);

    if (actorId === targetUserId) {
      throw new GroupDomainError(
        "CANNOT_REMOVE_SELF",
        "Use a opção Sair do grupo para encerrar sua própria participação.",
      );
    }

    const [target] = await tx
      .select({
        id: groupMembers.id,
        role: groupMembers.role,
        status: groupMembers.status,
        leftAt: groupMembers.leftAt,
      })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId),
        ),
      )
      .limit(1)
      .for("update");

    if (!target || target.status !== "ACCEPTED" || target.leftAt !== null) {
      throw new GroupDomainError(
        "TARGET_NOT_MEMBER",
        "Este usuário não é um integrante ativo do grupo.",
      );
    }

    if (target.role === "ADMIN") {
      throw new GroupDomainError(
        "CANNOT_REMOVE_ADMIN",
        "Administradores não podem ser removidos por outros administradores.",
      );
    }

    await tx
      .update(groupMembers)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, targetUserId),
          eq(groupMembers.status, "ACCEPTED"),
          isNull(groupMembers.leftAt),
        ),
      );
  });
}

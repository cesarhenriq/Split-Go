import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import type { Database } from "@/db/types";
import { GroupDomainError } from "@/features/groups/server/errors";
import {
  getActiveGroupAdminsForUpdate,
  lockActiveGroupMembership,
} from "@/features/groups/server/group-access";

export async function leaveGroup(
  groupId: string,
  userId: string,
  database: Database = db,
): Promise<void> {
  await database.transaction(async (tx) => {
    const membership = await lockActiveGroupMembership(tx, groupId, userId);

    if (!membership) {
      throw new GroupDomainError(
        "NOT_MEMBER",
        "Você não é um integrante ativo deste grupo.",
      );
    }

    if (membership.role === "ADMIN") {
      const admins = await getActiveGroupAdminsForUpdate(tx, groupId);

      if (admins.length <= 1) {
        throw new GroupDomainError(
          "LAST_ADMIN",
          "O último administrador não pode sair. Promova outro integrante a administrador primeiro.",
        );
      }
    }

    await tx
      .update(groupMembers)
      .set({ leftAt: sql`now()` })
      .where(eq(groupMembers.id, membership.id));
  });
}

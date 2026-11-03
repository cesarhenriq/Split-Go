import { eq } from "drizzle-orm";
import { db } from "@/db";
import { groups } from "@/db/schema";
import type { Database } from "@/db/types";
import { GroupDomainError } from "@/features/groups/server/errors";
import { requireGroupAdminForUpdate } from "@/features/groups/server/group-access";

export type UpdateGroupInput = {
  name: string;
  description: string | null;
};

export async function updateGroup(
  groupId: string,
  actorId: string,
  input: UpdateGroupInput,
  database: Database = db,
): Promise<void> {
  await database.transaction(async (tx) => {
    await requireGroupAdminForUpdate(tx, groupId, actorId);

    const [group] = await tx
      .update(groups)
      .set({
        name: input.name,
        description: input.description,
      })
      .where(eq(groups.id, groupId))
      .returning({ id: groups.id });

    if (!group) {
      throw new GroupDomainError("GROUP_NOT_FOUND", "Grupo não encontrado.");
    }
  });
}

import { eq } from "drizzle-orm";
import { groups } from "@/db/schema";
import type { DatabaseTransaction } from "@/db/types";
import { GroupDomainError } from "@/features/groups/server/errors";

export async function lockGroupForFinancialMutation(
  tx: DatabaseTransaction,
  groupId: string,
): Promise<void> {
  const [group] = await tx
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1)
    .for("update");

  if (!group) {
    throw new GroupDomainError("GROUP_NOT_FOUND", "Grupo não encontrado.");
  }
}

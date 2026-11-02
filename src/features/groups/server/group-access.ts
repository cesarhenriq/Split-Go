import { and, eq, inArray, isNull } from "drizzle-orm";
import { groupMembers } from "@/db/schema";
import type { DatabaseTransaction } from "@/db/types";

export type { DatabaseTransaction } from "@/db/types";

export type GroupAccessErrorCode =
  | "EMPTY_PARTICIPANT_LIST"
  | "MEMBERSHIP_NOT_ACTIVE";

export class GroupAccessError extends Error {
  readonly code: GroupAccessErrorCode;
  readonly userIds: string[];

  constructor(
    code: GroupAccessErrorCode,
    message: string,
    userIds: string[] = [],
  ) {
    super(message);
    this.name = "GroupAccessError";
    this.code = code;
    this.userIds = userIds;
  }
}

function uniqueUserIds(userIds: string[]) {
  return [...new Set(userIds.filter((userId) => userId.length > 0))];
}

export async function assertActiveGroupMembers(
  tx: DatabaseTransaction,
  groupId: string,
  userIds: string[],
): Promise<void> {
  const uniqueIds = uniqueUserIds(userIds);

  if (uniqueIds.length === 0) {
    throw new GroupAccessError(
      "EMPTY_PARTICIPANT_LIST",
      "Informe pelo menos um participante para validar o acesso ao grupo.",
    );
  }

  const activeMembers = await tx
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        inArray(groupMembers.userId, uniqueIds),
        eq(groupMembers.status, "ACCEPTED"),
        isNull(groupMembers.leftAt),
      ),
    )
    .for("share");

  const activeIds = new Set(activeMembers.map((member) => member.userId));
  const missingIds = uniqueIds.filter((userId) => !activeIds.has(userId));

  if (missingIds.length > 0) {
    throw new GroupAccessError(
      "MEMBERSHIP_NOT_ACTIVE",
      "Todos os participantes precisam ser membros ativos e aceitos no grupo.",
      missingIds,
    );
  }
}

export async function assertActiveGroupMember(
  tx: DatabaseTransaction,
  groupId: string,
  userId: string,
): Promise<void> {
  await assertActiveGroupMembers(tx, groupId, [userId]);
}

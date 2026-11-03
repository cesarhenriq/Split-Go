import { and, eq, inArray, isNull } from "drizzle-orm";
import { groupMembers } from "@/db/schema";
import type { Database, DatabaseTransaction } from "@/db/types";

export type { DatabaseTransaction } from "@/db/types";

export type GroupDatabase = Database | DatabaseTransaction;

export type GroupAccessErrorCode =
  | "EMPTY_PARTICIPANT_LIST"
  | "MEMBERSHIP_NOT_ACTIVE"
  | "GROUP_MEMBER_REQUIRED"
  | "GROUP_ADMIN_REQUIRED";

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

export type ActiveGroupMembership = {
  id: string;
  groupId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  joinedAt: Date | null;
  leftAt: Date | null;
};

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

export async function getActiveGroupMembership(
  database: GroupDatabase,
  groupId: string,
  userId: string,
): Promise<ActiveGroupMembership | null> {
  const [membership] = await database
    .select({
      id: groupMembers.id,
      groupId: groupMembers.groupId,
      userId: groupMembers.userId,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
      leftAt: groupMembers.leftAt,
    })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "ACCEPTED"),
        isNull(groupMembers.leftAt),
      ),
    )
    .limit(1);

  return membership ?? null;
}

export async function lockActiveGroupMembership(
  tx: DatabaseTransaction,
  groupId: string,
  userId: string,
): Promise<ActiveGroupMembership | null> {
  const [membership] = await tx
    .select({
      id: groupMembers.id,
      groupId: groupMembers.groupId,
      userId: groupMembers.userId,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
      leftAt: groupMembers.leftAt,
    })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "ACCEPTED"),
        isNull(groupMembers.leftAt),
      ),
    )
    .limit(1)
    .for("update");

  return membership ?? null;
}

export async function requireGroupMember(
  database: GroupDatabase,
  groupId: string,
  userId: string,
): Promise<ActiveGroupMembership> {
  const membership = await getActiveGroupMembership(database, groupId, userId);

  if (!membership) {
    throw new GroupAccessError(
      "GROUP_MEMBER_REQUIRED",
      "Você não participa deste grupo.",
    );
  }

  return membership;
}

export async function requireGroupAdmin(
  database: GroupDatabase,
  groupId: string,
  userId: string,
): Promise<ActiveGroupMembership> {
  const membership = await requireGroupMember(database, groupId, userId);

  if (membership.role !== "ADMIN") {
    throw new GroupAccessError(
      "GROUP_ADMIN_REQUIRED",
      "Somente administradores podem executar esta ação.",
    );
  }

  return membership;
}

export async function requireGroupAdminForUpdate(
  tx: DatabaseTransaction,
  groupId: string,
  userId: string,
): Promise<ActiveGroupMembership> {
  const membership = await lockActiveGroupMembership(tx, groupId, userId);

  if (!membership) {
    throw new GroupAccessError(
      "GROUP_MEMBER_REQUIRED",
      "Você não participa deste grupo.",
    );
  }

  if (membership.role !== "ADMIN") {
    throw new GroupAccessError(
      "GROUP_ADMIN_REQUIRED",
      "Somente administradores podem executar esta ação.",
    );
  }

  return membership;
}

export async function getActiveGroupAdminsForUpdate(
  tx: DatabaseTransaction,
  groupId: string,
) {
  return tx
    .select({
      id: groupMembers.id,
      userId: groupMembers.userId,
    })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.role, "ADMIN"),
        eq(groupMembers.status, "ACCEPTED"),
        isNull(groupMembers.leftAt),
      ),
    )
    .for("update");
}

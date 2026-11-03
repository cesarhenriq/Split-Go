import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { groupInvitations, groupMembers, groups, users } from "@/db/schema";
import type { Database } from "@/db/types";
import { getActiveGroupMembership } from "@/features/groups/server/group-access";
import type {
  GroupDetail,
  GroupMemberSummary,
  GroupSummary,
  ReceivedInvitation,
} from "@/features/groups/types";

export async function listGroupsForUser(
  userId: string,
  database: Database = db,
): Promise<GroupSummary[]> {
  const rows = await database
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      createdAt: groups.createdAt,
      creatorName: users.name,
      memberCount: sql<number>`(
        select count(*)::int
        from "group_members" gm
        where gm."group_id" = ${groups.id}
          and gm."status" = 'ACCEPTED'
          and gm."left_at" is null
      )`,
    })
    .from(groups)
    .innerJoin(
      groupMembers,
      and(
        eq(groupMembers.groupId, groups.id),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "ACCEPTED"),
        isNull(groupMembers.leftAt),
      ),
    )
    .innerJoin(users, eq(users.id, groups.createdBy))
    .orderBy(desc(groups.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    creatorName: row.creatorName,
    memberCount: Number(row.memberCount),
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getGroupDetailForUser(
  groupId: string,
  userId: string,
  database: Database = db,
): Promise<GroupDetail | null> {
  const membership = await getActiveGroupMembership(database, groupId, userId);

  if (!membership) {
    return null;
  }

  const [group] = await database
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      createdAt: groups.createdAt,
      creatorName: users.name,
    })
    .from(groups)
    .innerJoin(users, eq(users.id, groups.createdBy))
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) {
    return null;
  }

  const memberRows = await database
    .select({
      id: groupMembers.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, "ACCEPTED"),
        isNull(groupMembers.leftAt),
      ),
    )
    .orderBy(asc(groupMembers.joinedAt), asc(users.name));

  const members: GroupMemberSummary[] = memberRows.map((member) => ({
    id: member.id,
    userId: member.userId,
    name: member.name,
    email: member.email,
    role: member.role,
    joinedAt: member.joinedAt?.toISOString() ?? null,
  }));

  const pendingInvitations =
    membership.role === "ADMIN"
      ? (
          await database
            .select({
              id: groupInvitations.id,
              email: groupInvitations.email,
              createdAt: groupInvitations.createdAt,
              expiresAt: groupInvitations.expiresAt,
            })
            .from(groupInvitations)
            .where(
              and(
                eq(groupInvitations.groupId, groupId),
                eq(groupInvitations.status, "PENDING"),
                gt(groupInvitations.expiresAt, new Date()),
              ),
            )
            .orderBy(desc(groupInvitations.createdAt))
        ).map((invitation) => ({
          id: invitation.id,
          email: invitation.email,
          createdAt: invitation.createdAt.toISOString(),
          expiresAt: invitation.expiresAt.toISOString(),
        }))
      : [];

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    creatorName: group.creatorName,
    createdAt: group.createdAt.toISOString(),
    currentUserId: userId,
    currentUserRole: membership.role,
    members,
    pendingInvitations,
  };
}

export async function listReceivedInvitations(
  email: string,
  database: Database = db,
): Promise<ReceivedInvitation[]> {
  const now = new Date();
  const rows = await database
    .select({
      id: groupInvitations.id,
      groupId: groupInvitations.groupId,
      groupName: groups.name,
      inviterName: users.name,
      email: groupInvitations.email,
      status: groupInvitations.status,
      createdAt: groupInvitations.createdAt,
      expiresAt: groupInvitations.expiresAt,
    })
    .from(groupInvitations)
    .innerJoin(groups, eq(groups.id, groupInvitations.groupId))
    .innerJoin(users, eq(users.id, groupInvitations.invitedBy))
    .where(eq(groupInvitations.email, email))
    .orderBy(desc(groupInvitations.createdAt));

  return rows.map((invitation) => {
    const displayStatus =
      invitation.status === "PENDING" && invitation.expiresAt <= now
        ? "EXPIRED"
        : invitation.status;

    return {
      id: invitation.id,
      groupId: invitation.groupId,
      groupName: invitation.groupName,
      inviterName: invitation.inviterName,
      email: invitation.email,
      status: invitation.status,
      displayStatus,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
      canRespond: displayStatus === "PENDING",
    };
  });
}

export async function getPendingInvitationsCount(
  email: string,
  database: Database = db,
): Promise<number> {
  const [result] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(groupInvitations)
    .where(
      and(
        eq(groupInvitations.email, email),
        eq(groupInvitations.status, "PENDING"),
        gt(groupInvitations.expiresAt, new Date()),
      ),
    );

  return Number(result?.count ?? 0);
}

export async function getGroupName(
  groupId: string,
  database: Database = db,
): Promise<string | null> {
  const [group] = await database
    .select({ name: groups.name })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  return group?.name ?? null;
}

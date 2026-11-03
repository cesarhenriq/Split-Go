import { groupMembers, groups, users } from "@/db/schema";
import type { Database } from "@/db/types";
import { createTestDatabase, resetTestDatabase } from "@/test-utils/database";

export async function createTestUser(
  database: Database,
  input: { name: string; email: string },
): Promise<string> {
  const [user] = await database
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash: "hash",
    })
    .returning({ id: users.id });

  return user.id;
}

export async function createGroupWithAdmin(
  database: Database,
  creatorId: string,
  name = "Grupo de teste",
): Promise<string> {
  const [group] = await database
    .insert(groups)
    .values({
      name,
      createdBy: creatorId,
    })
    .returning({ id: groups.id });

  await database.insert(groupMembers).values({
    groupId: group.id,
    userId: creatorId,
    role: "ADMIN",
    status: "ACCEPTED",
    joinedAt: new Date(),
  });

  return group.id;
}

export async function addAcceptedMember(
  database: Database,
  groupId: string,
  userId: string,
  role: "ADMIN" | "MEMBER" = "MEMBER",
): Promise<void> {
  await database.insert(groupMembers).values({
    groupId,
    userId,
    role,
    status: "ACCEPTED",
    joinedAt: new Date(),
  });
}

export { createTestDatabase, resetTestDatabase };

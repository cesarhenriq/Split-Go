import { db } from "@/db";
import { groupMembers, groups } from "@/db/schema";
import type { Database } from "@/db/types";

export type CreateGroupInput = {
  name: string;
  description: string | null;
};

export async function createGroup(
  input: CreateGroupInput,
  userId: string,
  database: Database = db,
): Promise<{ id: string }> {
  return database.transaction(async (tx) => {
    const [group] = await tx
      .insert(groups)
      .values({
        name: input.name,
        description: input.description,
        createdBy: userId,
      })
      .returning({ id: groups.id });

    await tx.insert(groupMembers).values({
      groupId: group.id,
      userId,
      role: "ADMIN",
      status: "ACCEPTED",
      joinedAt: new Date(),
    });

    return { id: group.id };
  });
}

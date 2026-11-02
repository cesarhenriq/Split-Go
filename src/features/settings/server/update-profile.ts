import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Database } from "@/db/types";
import type { CurrentUser } from "@/lib/auth/types";

export type UpdateProfileInput = {
  name: string;
  email: string;
};

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
  database: Database = db,
): Promise<CurrentUser> {
  const [user] = await database
    .update(users)
    .set({
      name: input.name,
      email: input.email,
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

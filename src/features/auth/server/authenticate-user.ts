import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { Database } from "@/db/types";
import { verifyDummyPassword, verifyPassword } from "@/lib/auth/password";
import type { CurrentUser } from "@/lib/auth/types";

export async function authenticateUser(
  email: string,
  password: string,
  database: Database = db,
): Promise<CurrentUser | null> {
  const [user] = await database
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      passwordHash: users.passwordHash,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    await verifyDummyPassword(password);
    return null;
  }

  const isValid = await verifyPassword(user.passwordHash, password);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

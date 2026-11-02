import { db } from "@/db";
import { users } from "@/db/schema";
import type { Database } from "@/db/types";
import { hashPassword } from "@/lib/auth/password";
import { type CreatedSession, createSession } from "@/lib/auth/session";
import type { CurrentUser } from "@/lib/auth/types";
import { isPostgresUniqueViolation } from "@/lib/db/errors";

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export type RegisteredUser = {
  user: CurrentUser;
  session: CreatedSession;
};

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("Este e-mail já está cadastrado.");
    this.name = "EmailAlreadyInUseError";
  }
}

export async function registerUser(
  input: RegisterUserInput,
  database: Database = db,
): Promise<RegisteredUser> {
  const passwordHash = await hashPassword(input.password);

  try {
    return await database.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          passwordHash,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        });

      const session = await createSession(tx, user.id);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        },
        session,
      };
    });
  } catch (error) {
    if (isPostgresUniqueViolation(error, "users_email_unique")) {
      throw new EmailAlreadyInUseError();
    }

    throw error;
  }
}

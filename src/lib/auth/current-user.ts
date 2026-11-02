import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { getSessionToken } from "./cookies";
import { findUserBySessionToken } from "./session";
import type { CurrentUser } from "./types";

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  await connection();

  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  return findUserBySessionToken(token);
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireGuest(): Promise<void> {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }
}

"use server";

import { redirect } from "next/navigation";
import { authenticateUser } from "@/features/auth/server/authenticate-user";
import {
  EmailAlreadyInUseError,
  registerUser,
} from "@/features/auth/server/register-user";
import type { AuthFormState } from "@/features/auth/types";
import {
  clearSessionCookie,
  getSessionToken,
  setSessionCookie,
} from "@/lib/auth/cookies";
import { createSessionForUser, deleteSessionByToken } from "@/lib/auth/session";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function registerAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    name: formString(formData, "name"),
    email: formString(formData, "email"),
  };

  const parsed = registerSchema.safeParse({
    ...values,
    password: formString(formData, "password"),
    confirmPassword: formString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const { session } = await registerUser({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    await setSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    if (error instanceof EmailAlreadyInUseError) {
      return {
        status: "error",
        message: "Este e-mail já está cadastrado.",
        fieldErrors: {
          email: ["Este e-mail já está cadastrado."],
        },
        values,
      };
    }

    return {
      status: "error",
      message: "Não foi possível criar sua conta. Tente novamente.",
      values,
    };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const values = {
    email: formString(formData, "email"),
  };

  const parsed = loginSchema.safeParse({
    ...values,
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe um e-mail e uma senha válidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);

  if (!user) {
    return {
      status: "error",
      message: "E-mail ou senha inválidos.",
      values,
    };
  }

  const session = await createSessionForUser(user.id);

  await setSessionCookie(session.token, session.expiresAt);

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();

  if (token) {
    await deleteSessionByToken(token);
  }

  await clearSessionCookie();

  redirect("/login");
}

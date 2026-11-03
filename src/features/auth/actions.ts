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
import { getClientIp } from "@/lib/security/client-ip";
import {
  clearRateLimit,
  consumeRateLimit,
  hashRateLimitKey,
} from "@/lib/security/rate-limit";
import {
  isRateLimitDisabled,
  rateLimitPolicy,
} from "@/lib/security/rate-limit-policy";
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

  const clientIp = await getClientIp();
  const registerLimitKey = hashRateLimitKey("register", clientIp);

  if (!isRateLimitDisabled()) {
    try {
      const limit = await consumeRateLimit({
        key: registerLimitKey,
        ...rateLimitPolicy.register,
      });

      if (!limit.allowed) {
        return {
          status: "error",
          message:
            "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.",
          values,
        };
      }
    } catch (error) {
      console.error("registerAction rate limit failed", error);

      return {
        status: "error",
        message: "Não foi possível criar sua conta agora. Tente novamente.",
        values,
      };
    }
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

    console.error("registerAction failed", error);

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

  const clientIp = await getClientIp();
  const loginLimitKey = hashRateLimitKey(
    "login",
    `${clientIp}:${parsed.data.email}`,
  );

  if (!isRateLimitDisabled()) {
    try {
      const limit = await consumeRateLimit({
        key: loginLimitKey,
        ...rateLimitPolicy.login,
      });

      if (!limit.allowed) {
        return {
          status: "error",
          message:
            "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
          values,
        };
      }
    } catch (error) {
      console.error("loginAction rate limit failed", error);

      return {
        status: "error",
        message: "Não foi possível entrar agora. Tente novamente.",
        values,
      };
    }
  }

  let user: Awaited<ReturnType<typeof authenticateUser>>;

  try {
    user = await authenticateUser(parsed.data.email, parsed.data.password);
  } catch (error) {
    console.error("loginAction authentication failed", error);

    return {
      status: "error",
      message: "Não foi possível entrar agora. Tente novamente.",
      values,
    };
  }

  if (!user) {
    if (!isRateLimitDisabled()) {
      try {
        const ipLimit = await consumeRateLimit({
          key: hashRateLimitKey("login-ip", clientIp),
          ...rateLimitPolicy.loginIp,
        });

        if (!ipLimit.allowed) {
          return {
            status: "error",
            message:
              "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
            values,
          };
        }
      } catch (error) {
        console.error("loginAction ip rate limit failed", error);
      }
    }

    return {
      status: "error",
      message: "E-mail ou senha inválidos.",
      values,
    };
  }

  try {
    const session = await createSessionForUser(user.id);
    await setSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    console.error("loginAction session creation failed", error);

    return {
      status: "error",
      message: "Não foi possível entrar agora. Tente novamente.",
      values,
    };
  }

  if (!isRateLimitDisabled()) {
    try {
      await clearRateLimit(loginLimitKey);
    } catch (error) {
      console.error("loginAction rate limit reset failed", error);
    }
  }

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

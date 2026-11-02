"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/feedback/form-alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/config/routes";
import { loginAction } from "@/features/auth/actions";
import { initialAuthFormState } from "@/features/auth/types";

export function LoginForm() {
  const [state, action, pending] = useActionState(
    loginAction,
    initialAuthFormState,
  );

  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-page-title tracking-tight">Entrar</h1>
        <p className="text-body text-neutral-500">
          Acesse sua conta para acompanhar grupos, despesas e quitações.
        </p>
      </div>

      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}

      <form action={action} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            defaultValue={state.values?.email}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "login-email-error" : undefined}
            required
          />
          <FieldError id="login-email-error" messages={emailError} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Senha</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              passwordError ? "login-password-error" : undefined
            }
            required
          />
          <FieldError id="login-password-error" messages={passwordError} />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={pending}>
          Entrar
        </Button>
      </form>

      <p className="text-center text-body text-neutral-500">
        Ainda não tem uma conta?{" "}
        <Link
          href={routes.auth.register}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormAlert } from "@/components/feedback/form-alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/config/routes";
import { registerAction } from "@/features/auth/actions";
import { initialAuthFormState } from "@/features/auth/types";

export function RegisterForm() {
  const [state, action, pending] = useActionState(
    registerAction,
    initialAuthFormState,
  );

  const nameError = state.fieldErrors?.name;
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;
  const confirmPasswordError = state.fieldErrors?.confirmPassword;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-page-title tracking-tight">Criar conta</h1>
        <p className="text-body text-neutral-500">
          Comece a organizar despesas compartilhadas em poucos passos.
        </p>
      </div>

      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}

      <form action={action} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="register-name">Nome completo</Label>
          <Input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            defaultValue={state.values?.name}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "register-name-error" : undefined}
            required
          />
          <FieldError id="register-name-error" messages={nameError} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">E-mail</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            defaultValue={state.values?.email}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "register-email-error" : undefined}
            required
          />
          <FieldError id="register-email-error" messages={emailError} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Senha</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Crie uma senha"
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              passwordError
                ? "register-password-error"
                : "register-password-hint"
            }
            required
          />
          <p id="register-password-hint" className="text-meta text-neutral-500">
            Use pelo menos 8 caracteres.
          </p>
          <FieldError id="register-password-error" messages={passwordError} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-confirm-password">Confirmar senha</Label>
          <Input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            aria-invalid={Boolean(confirmPasswordError)}
            aria-describedby={
              confirmPasswordError
                ? "register-confirm-password-error"
                : undefined
            }
            required
          />
          <FieldError
            id="register-confirm-password-error"
            messages={confirmPasswordError}
          />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={pending}>
          Criar conta
        </Button>
      </form>

      <p className="text-center text-body text-neutral-500">
        Já possui uma conta?{" "}
        <Link
          href={routes.auth.login}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

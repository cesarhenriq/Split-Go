"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/feedback/form-alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/features/settings/actions";
import { initialProfileFormState } from "@/features/settings/types";
import type { CurrentUser } from "@/lib/auth/types";

export type ProfileFormProps = {
  user: CurrentUser;
};

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    initialProfileFormState,
  );

  const nameError = state.fieldErrors?.name;
  const emailError = state.fieldErrors?.email;

  return (
    <form action={action} className="space-y-5">
      {state.status !== "idle" && state.message && (
        <FormAlert tone={state.status === "success" ? "success" : "error"}>
          {state.message}
        </FormAlert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Nome</Label>
          <Input
            id="profile-name"
            name="name"
            autoComplete="name"
            defaultValue={state.values?.name ?? user.name}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "profile-name-error" : undefined}
            required
          />
          <FieldError id="profile-name-error" messages={nameError} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">E-mail</Label>
          <Input
            id="profile-email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values?.email ?? user.email}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "profile-email-error" : undefined}
            required
          />
          <FieldError id="profile-email-error" messages={emailError} />
        </div>
      </div>

      <Button type="submit" loading={pending}>
        Salvar alterações
      </Button>
    </form>
  );
}

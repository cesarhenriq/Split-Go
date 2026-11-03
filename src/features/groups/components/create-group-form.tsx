"use client";

import { useActionState } from "react";
import { FormAlert } from "@/components/feedback/form-alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { createGroupAction } from "@/features/groups/actions";
import { initialGroupFormState } from "@/features/groups/types";

export function CreateGroupForm() {
  const [state, action, pending] = useActionState(
    createGroupAction,
    initialGroupFormState,
  );

  const nameError = state.fieldErrors?.name;
  const descriptionError = state.fieldErrors?.description;

  return (
    <form action={action} className="space-y-5">
      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}

      <div className="space-y-2">
        <Label htmlFor="group-name">Nome do grupo</Label>
        <Input
          id="group-name"
          name="name"
          placeholder="Ex.: Viagem para a praia"
          defaultValue={state.values?.name}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "group-name-error" : undefined}
          required
        />
        <FieldError id="group-name-error" messages={nameError} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-description">Descrição</Label>
        <Textarea
          id="group-description"
          name="description"
          placeholder="Opcional: descreva o objetivo do grupo."
          defaultValue={state.values?.description}
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={
            descriptionError ? "group-description-error" : undefined
          }
        />
        <FieldError id="group-description-error" messages={descriptionError} />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink
          href={routes.dashboard.groups}
          variant="outline"
          className="sm:w-auto"
        >
          Cancelar
        </ButtonLink>
        <Button type="submit" loading={pending}>
          Criar grupo
        </Button>
      </div>
    </form>
  );
}

"use client";

import { Pencil } from "lucide-react";
import { useActionState, useState } from "react";
import { FormAlert } from "@/components/feedback/form-alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateGroupAction } from "@/features/groups/actions";
import {
  type GroupDetail,
  initialGroupFormState,
} from "@/features/groups/types";

export type EditGroupDialogProps = {
  group: GroupDetail;
};

export function EditGroupDialog({ group }: EditGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    updateGroupAction,
    initialGroupFormState,
  );

  const nameError = state.fieldErrors?.name;
  const descriptionError = state.fieldErrors?.description;

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Editar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>Editar grupo</DialogTitle>
            <DialogDescription>
              Atualize o nome e a descrição do grupo.
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="space-y-5 p-6">
            <input type="hidden" name="groupId" value={group.id} />

            {state.status === "error" && state.message && (
              <FormAlert>{state.message}</FormAlert>
            )}
            {state.status === "success" && state.message && (
              <FormAlert tone="success">{state.message}</FormAlert>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Nome do grupo</Label>
              <Input
                id="edit-group-name"
                name="name"
                defaultValue={state.values?.name ?? group.name}
                aria-invalid={Boolean(nameError)}
                aria-describedby={
                  nameError ? "edit-group-name-error" : undefined
                }
                required
              />
              <FieldError id="edit-group-name-error" messages={nameError} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-group-description">Descrição</Label>
              <Textarea
                id="edit-group-description"
                name="description"
                defaultValue={
                  state.values?.description ?? group.description ?? ""
                }
                aria-invalid={Boolean(descriptionError)}
                aria-describedby={
                  descriptionError ? "edit-group-description-error" : undefined
                }
              />
              <FieldError
                id="edit-group-description-error"
                messages={descriptionError}
              />
            </div>

            <DialogFooter className="p-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Fechar
              </Button>
              <Button type="submit" loading={pending}>
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

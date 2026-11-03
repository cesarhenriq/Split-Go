"use client";

import { X } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { cancelInvitationAction } from "@/features/groups/actions";
import { initialGroupActionState } from "@/features/groups/types";

export type CancelInvitationButtonProps = {
  groupId: string;
  invitationId: string;
  email: string;
};

export function CancelInvitationButton({
  groupId,
  invitationId,
  email,
}: CancelInvitationButtonProps) {
  const [state, action, pending] = useActionState(
    cancelInvitationAction,
    initialGroupActionState,
  );
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runCancel() {
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("invitationId", invitationId);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-danger-700 hover:bg-danger-50"
        onClick={() => setOpen(true)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
        Cancelar
      </Button>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-meta text-danger-600">
          {state.message}
        </p>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Cancelar convite?"
        description={`O convite para ${email} será invalidado e não poderá mais ser aceito.`}
        confirmLabel="Cancelar convite"
        cancelLabel="Voltar"
        tone="danger"
        loading={pending || isPending}
        onConfirm={runCancel}
      />
    </div>
  );
}

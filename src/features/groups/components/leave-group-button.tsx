"use client";

import { LogOut } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { leaveGroupAction } from "@/features/groups/actions";
import { initialGroupActionState } from "@/features/groups/types";

export type LeaveGroupButtonProps = {
  groupId: string;
  isAdmin: boolean;
};

export function LeaveGroupButton({ groupId, isAdmin }: LeaveGroupButtonProps) {
  const [state, action, pending] = useActionState(
    leaveGroupAction,
    initialGroupActionState,
  );
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function runLeave() {
    const formData = new FormData();
    formData.set("groupId", groupId);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        className="text-danger-700 hover:bg-danger-50"
        onClick={() => setOpen(true)}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sair do grupo
      </Button>

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="max-w-xs text-right text-meta text-danger-600"
        >
          {state.message}
        </p>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Sair do grupo?"
        description={
          isAdmin
            ? "Você deixará de participar do grupo. Se for o último administrador, será necessário promover outra pessoa primeiro."
            : "Você deixará de participar deste grupo. Seu histórico será preservado."
        }
        confirmLabel="Sair do grupo"
        tone="danger"
        loading={pending || isPending}
        onConfirm={runLeave}
      />
    </div>
  );
}

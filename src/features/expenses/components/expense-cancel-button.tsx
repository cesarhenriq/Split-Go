"use client";

import { Ban } from "lucide-react";
import { useActionState, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { cancelExpenseAction } from "@/features/expenses/actions";
import { initialExpenseActionState } from "@/features/expenses/types";

export type ExpenseCancelButtonProps = {
  groupId: string;
  expenseId: string;
};

export function ExpenseCancelButton({
  groupId,
  expenseId,
}: ExpenseCancelButtonProps) {
  const [state, action, pending] = useActionState(
    cancelExpenseAction,
    initialExpenseActionState,
  );
  const [open, setOpen] = useState(false);

  function runCancel() {
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("expenseId", expenseId);
    action(formData);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        className="text-danger-700 hover:bg-danger-50"
        onClick={() => setOpen(true)}
      >
        <Ban className="h-4 w-4" aria-hidden="true" />
        Cancelar despesa
      </Button>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-meta text-danger-600">
          {state.message}
        </p>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Cancelar despesa?"
        description="A despesa será mantida no histórico, mas deixará de aparecer nos totais ativos. Esta ação não exclui os rateios."
        confirmLabel="Cancelar despesa"
        cancelLabel="Voltar"
        tone="danger"
        loading={pending}
        onConfirm={runCancel}
      />
    </div>
  );
}

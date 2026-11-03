"use client";

import { Ban, Check } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  cancelSettlementAction,
  confirmSettlementAction,
} from "@/features/settlements/actions";
import { initialSettlementActionState } from "@/features/settlements/types";

export type SettlementActionsProps = {
  groupId: string;
  settlementId: string;
  canConfirm: boolean;
  canCancel: boolean;
  payerName: string;
  amountLabel: string;
};

export function SettlementActions({
  groupId,
  settlementId,
  canConfirm,
  canCancel,
  payerName,
  amountLabel,
}: SettlementActionsProps) {
  if (!canConfirm && !canCancel) {
    return null;
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:justify-end">
      {canCancel && (
        <CancelSettlementButton groupId={groupId} settlementId={settlementId} />
      )}
      {canConfirm && (
        <ConfirmSettlementButton
          groupId={groupId}
          settlementId={settlementId}
          payerName={payerName}
          amountLabel={amountLabel}
        />
      )}
    </div>
  );
}

function ConfirmSettlementButton({
  groupId,
  settlementId,
  payerName,
  amountLabel,
}: {
  groupId: string;
  settlementId: string;
  payerName: string;
  amountLabel: string;
}) {
  const [state, action, pending] = useActionState(
    confirmSettlementAction,
    initialSettlementActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function runConfirm() {
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("settlementId", settlementId);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button type="button" onClick={() => setOpen(true)}>
        <Check className="h-4 w-4" aria-hidden="true" />
        Confirmar recebimento
      </Button>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-meta text-danger-600">
          {state.message}
        </p>
      )}

      {state.status === "success" && state.message && (
        <output className="text-meta text-success-700">{state.message}</output>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Confirmar recebimento?"
        description={`${payerName} informou um pagamento de ${amountLabel}. Você confirma que recebeu esse valor? Esta ação atualiza os saldos do grupo.`}
        confirmLabel="Confirmar recebimento"
        cancelLabel="Agora não"
        loading={pending || isPending}
        onConfirm={runConfirm}
      />
    </div>
  );
}

function CancelSettlementButton({
  groupId,
  settlementId,
}: {
  groupId: string;
  settlementId: string;
}) {
  const [state, action, pending] = useActionState(
    cancelSettlementAction,
    initialSettlementActionState,
  );
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function runCancel() {
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("settlementId", settlementId);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button
        type="button"
        variant="outline"
        className="text-danger-700 hover:bg-danger-50"
        onClick={() => setOpen(true)}
      >
        <Ban className="h-4 w-4" aria-hidden="true" />
        Cancelar pagamento
      </Button>

      {state.status === "error" && state.message && (
        <p role="alert" className="text-meta text-danger-600">
          {state.message}
        </p>
      )}

      {state.status === "success" && state.message && (
        <output className="text-meta text-success-700">{state.message}</output>
      )}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Cancelar pagamento?"
        description="O pagamento continuará no histórico como cancelado e não afetará os saldos do grupo."
        confirmLabel="Cancelar pagamento"
        cancelLabel="Voltar"
        tone="danger"
        loading={pending || isPending}
        onConfirm={runCancel}
      />
    </div>
  );
}

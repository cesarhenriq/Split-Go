"use client";

import { HandCoins, Info } from "lucide-react";
import { useActionState, useState } from "react";
import { FormAlert } from "@/components/feedback/form-alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createSettlementAction } from "@/features/settlements/actions";
import {
  initialSettlementFormState,
  type SettlementFormContext,
} from "@/features/settlements/types";
import { formatCents, formatCentsInput, parseAmountToCents } from "@/lib/money";

export type SettlementFormProps = {
  context: SettlementFormContext;
  defaultPaidAt: string;
  initialReceivedBy?: string;
  initialAmount?: string;
};

function initialAmountInput(value?: string) {
  if (!value) return "";

  try {
    return formatCentsInput(value);
  } catch {
    return "";
  }
}

export function SettlementForm({
  context,
  defaultPaidAt,
  initialReceivedBy,
  initialAmount,
}: SettlementFormProps) {
  const creditorIds = new Set(
    context.creditors.map((creditor) => creditor.userId),
  );
  const [receivedBy, setReceivedBy] = useState(
    initialReceivedBy && creditorIds.has(initialReceivedBy)
      ? initialReceivedBy
      : (context.creditors[0]?.userId ?? ""),
  );
  const [amount, setAmount] = useState(initialAmountInput(initialAmount));
  const [paidAt, setPaidAt] = useState(defaultPaidAt);

  const [state, action, pending] = useActionState(
    createSettlementAction,
    initialSettlementFormState,
  );

  const selectedCreditor = context.creditors.find(
    (creditor) => creditor.userId === receivedBy,
  );
  const availableToPay = BigInt(context.currentUserAvailableToPay);
  const availableToReceive = selectedCreditor
    ? BigInt(selectedCreditor.availableToReceive)
    : 0n;
  const maxAmount =
    availableToPay < availableToReceive ? availableToPay : availableToReceive;

  let amountCents: bigint | null = null;
  let amountError: string | null = null;

  try {
    amountCents = parseAmountToCents(amount);

    if (amountCents <= 0n) {
      amountError = "O valor deve ser maior que zero.";
    } else if (amountCents > maxAmount) {
      amountError = `O valor máximo disponível é ${formatCents(maxAmount)}.`;
    }
  } catch (error) {
    amountError =
      amount.trim().length === 0
        ? "Informe o valor do pagamento."
        : error instanceof Error
          ? error.message
          : "Valor inválido.";
  }

  const dateError = paidAt.trim().length === 0 ? "Informe a data." : null;
  const formValid = amountError === null && dateError === null;

  const amountFieldError = state.fieldErrors?.amount;
  const receiverFieldError = state.fieldErrors?.receivedBy;
  const paidAtFieldError = state.fieldErrors?.paidAt;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="groupId" value={context.groupId} />

      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <p className="text-meta text-neutral-500">Pagador</p>
          <p className="mt-1 text-sm font-medium">{context.currentUserName}</p>
          <p className="text-meta text-neutral-500">Você</p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <p className="text-meta text-neutral-500">
            Seu saldo devedor disponível
          </p>
          <p className="mt-1 text-sm font-medium">
            {formatCents(availableToPay)}
          </p>
          <p className="text-meta text-neutral-500">
            Pagamentos pendentes já reservados são descontados.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
          <p className="text-meta text-neutral-500">Disponível para receber</p>
          <p className="mt-1 text-sm font-medium">
            {selectedCreditor
              ? formatCents(availableToReceive)
              : "Selecione o destinatário"}
          </p>
          <p className="text-meta text-neutral-500">
            {selectedCreditor?.name ?? "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="settlement-receiver">Quem recebeu</Label>
          <Select
            id="settlement-receiver"
            name="receivedBy"
            value={receivedBy}
            onChange={(event) => setReceivedBy(event.target.value)}
            aria-invalid={Boolean(receiverFieldError)}
            aria-describedby={
              receiverFieldError ? "settlement-receiver-error" : undefined
            }
            required
          >
            {context.creditors.map((creditor) => (
              <option key={creditor.userId} value={creditor.userId}>
                {creditor.name} ({creditor.email}) ·{" "}
                {formatCents(creditor.availableToReceive)} disponível
              </option>
            ))}
          </Select>
          <FieldError
            id="settlement-receiver-error"
            messages={receiverFieldError}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settlement-amount">Valor do pagamento</Label>
          <Input
            id="settlement-amount"
            name="amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0,00"
            aria-invalid={Boolean(amountFieldError || amountError)}
            aria-describedby={
              amountFieldError || amountError
                ? "settlement-amount-error"
                : undefined
            }
            required
          />
          <FieldError
            id="settlement-amount-error"
            messages={
              amountFieldError ?? (amountError ? [amountError] : undefined)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settlement-paid-at">Data do pagamento</Label>
          <Input
            id="settlement-paid-at"
            name="paidAt"
            type="date"
            value={paidAt}
            onChange={(event) => setPaidAt(event.target.value)}
            aria-invalid={Boolean(paidAtFieldError || dateError)}
            aria-describedby={
              paidAtFieldError || dateError
                ? "settlement-paid-at-error"
                : undefined
            }
            required
          />
          <FieldError
            id="settlement-paid-at-error"
            messages={paidAtFieldError ?? (dateError ? [dateError] : undefined)}
          />
        </div>
      </div>

      <div className="flex gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-body text-primary-800">
        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          O pagamento será registrado como <strong>pendente</strong>. Os saldos
          só serão atualizados depois que{" "}
          {selectedCreditor?.name ?? "o destinatário"} confirmar o recebimento.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink
          href={`/groups/${context.groupId}/dashboard`}
          variant="outline"
        >
          Cancelar
        </ButtonLink>
        <Button
          type="submit"
          loading={pending}
          disabled={!formValid || availableToPay <= 0n || !selectedCreditor}
        >
          <HandCoins className="h-4 w-4" aria-hidden="true" />
          Registrar pagamento
        </Button>
      </div>
    </form>
  );
}

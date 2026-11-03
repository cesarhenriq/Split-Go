"use client";

import { useActionState, useState } from "react";
import { FormAlert } from "@/components/feedback/form-alert";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  createExpenseAction,
  updateExpenseAction,
} from "@/features/expenses/actions";
import { SplitMethodSelector } from "@/features/expenses/components/split-method-selector";
import { SplitPreview } from "@/features/expenses/components/split-preview";
import {
  type CalculatedShare,
  calculateEqualSplit,
  calculateFixedSplit,
  calculatePercentageSplitFromBasisPoints,
} from "@/features/expenses/lib/split-calculator";
import {
  type ExpenseFormContext,
  type ExpenseFormInitial,
  initialExpenseFormState,
} from "@/features/expenses/types";
import {
  formatBasisPoints,
  formatCentsInput,
  parseAmountToCents,
  parsePercentageToBasisPoints,
} from "@/lib/money";

type SplitMethod = "EQUAL" | "PERCENTAGE" | "FIXED";

export type ExpenseFormProps = {
  mode: "create" | "edit";
  context: ExpenseFormContext;
  defaultExpenseDate: string;
  initial?: ExpenseFormInitial;
};

function equalBasisPoints(userIds: string[]): Record<string, string> {
  if (userIds.length === 0) return {};

  const base = Math.floor(10_000 / userIds.length);
  const remainder = 10_000 % userIds.length;

  return Object.fromEntries(
    userIds.map((userId, index) => [
      userId,
      formatBasisPoints(base + (index < remainder ? 1 : 0)).replace("%", ""),
    ]),
  );
}

export function ExpenseForm({
  mode,
  context,
  defaultExpenseDate,
  initial,
}: ExpenseFormProps) {
  const memberIds = new Set(context.members.map((member) => member.id));
  const initialSelectedIds = initial
    ? initial.participants.map((participant) => participant.userId)
    : context.members.map((member) => member.id);

  const [description, setDescription] = useState(initial?.description ?? "");
  const [totalAmount, setTotalAmount] = useState(
    initial ? formatCentsInput(initial.totalAmount) : "",
  );
  const [expenseDate, setExpenseDate] = useState(
    initial?.expenseDate ?? defaultExpenseDate,
  );
  const [paidBy, setPaidBy] = useState(
    initial?.paidBy ?? context.currentUserId,
  );
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(
    initial?.splitMethod ?? "EQUAL",
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [percentageInputs, setPercentageInputs] = useState<
    Record<string, string>
  >(() =>
    Object.fromEntries(
      (initial?.participants ?? [])
        .filter((participant) => participant.percentage !== null)
        .map((participant) => [
          participant.userId,
          participant.percentage ?? "",
        ]),
    ),
  );
  const [fixedInputs, setFixedInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (initial?.participants ?? [])
        .filter((participant) => participant.amount !== null)
        .map((participant) => [
          participant.userId,
          formatCentsInput(participant.amount ?? "0"),
        ]),
    ),
  );

  const [state, action, pending] = useActionState(
    mode === "create" ? createExpenseAction : updateExpenseAction,
    initialExpenseFormState,
  );

  const selectedMembers = context.members.filter((member) =>
    selectedIds.includes(member.id),
  );
  const unknownSelectedIds = selectedIds.filter((id) => !memberIds.has(id));

  function changeMethod(nextMethod: SplitMethod) {
    setSplitMethod(nextMethod);

    if (nextMethod === "PERCENTAGE") {
      setPercentageInputs(equalBasisPoints(selectedIds));
      return;
    }

    if (nextMethod === "FIXED") {
      try {
        const total = parseAmountToCents(totalAmount);
        const shares = calculateEqualSplit(
          total,
          selectedIds.map((userId) => ({ userId })),
        );

        setFixedInputs(
          Object.fromEntries(
            shares.map((share) => [
              share.userId,
              formatCentsInput(share.shareAmount),
            ]),
          ),
        );
      } catch {
        // The preview will explain why the current values are invalid.
      }
    }
  }

  function toggleParticipant(userId: string) {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function redistribute() {
    if (splitMethod === "PERCENTAGE") {
      setPercentageInputs(equalBasisPoints(selectedIds));
      return;
    }

    if (splitMethod === "FIXED") {
      try {
        const total = parseAmountToCents(totalAmount);
        const shares = calculateEqualSplit(
          total,
          selectedIds.map((userId) => ({ userId })),
        );

        setFixedInputs(
          Object.fromEntries(
            shares.map((share) => [
              share.userId,
              formatCentsInput(share.shareAmount),
            ]),
          ),
        );
      } catch {
        // The preview will explain why the current values are invalid.
      }
    }
  }

  let previewRows: (CalculatedShare & { name: string })[] = [];
  let previewTotal: bigint | null = null;
  let previewDifference: bigint | null = null;
  let previewError: string | null = null;

  try {
    previewTotal = parseAmountToCents(totalAmount);

    if (previewTotal <= 0n) {
      throw new Error("O valor total deve ser maior que zero.");
    }

    if (selectedMembers.length === 0) {
      throw new Error("Selecione pelo menos um participante.");
    }

    let shares: CalculatedShare[];

    if (splitMethod === "EQUAL") {
      shares = calculateEqualSplit(
        previewTotal,
        selectedMembers.map((member) => ({ userId: member.id })),
      );
    } else if (splitMethod === "PERCENTAGE") {
      const participants = selectedMembers.map((member) => {
        const raw = percentageInputs[member.id] ?? "";

        if (!raw) {
          throw new Error(`Informe o percentual de ${member.name}.`);
        }

        return {
          userId: member.id,
          basisPoints: parsePercentageToBasisPoints(raw),
        };
      });

      shares = calculatePercentageSplitFromBasisPoints(
        previewTotal,
        participants,
      );
    } else {
      const participants = selectedMembers.map((member) => {
        const raw = fixedInputs[member.id] ?? "";

        if (!raw) {
          throw new Error(`Informe o valor de ${member.name}.`);
        }

        return {
          userId: member.id,
          amount: parseAmountToCents(raw),
        };
      });

      shares = calculateFixedSplit(previewTotal, participants);
    }

    const byUserId = new Map(shares.map((share) => [share.userId, share]));
    previewRows = selectedMembers.map((member) => ({
      ...(byUserId.get(member.id) ?? {
        userId: member.id,
        shareAmount: 0n,
        percentage: null,
      }),
      name: member.name,
    }));
    previewDifference =
      previewTotal -
      shares.reduce((total, share) => total + share.shareAmount, 0n);
  } catch (error) {
    previewRows = [];
    previewDifference = null;
    previewError = error instanceof Error ? error.message : "Rateio inválido.";
  }

  const previewValid =
    previewError === null &&
    previewRows.length === selectedMembers.length &&
    previewDifference === 0n;

  const descriptionError = state.fieldErrors?.description;
  const totalError = state.fieldErrors?.totalAmount;
  const dateError = state.fieldErrors?.expenseDate;
  const payerError = state.fieldErrors?.paidBy;
  const participantsError = state.fieldErrors?.participants;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="groupId" value={context.groupId} />
      {initial && (
        <input type="hidden" name="expenseId" value={initial.expenseId} />
      )}
      {unknownSelectedIds.map((userId) => (
        <input
          key={userId}
          type="hidden"
          name="participantIds"
          value={userId}
        />
      ))}

      {state.status === "error" && state.message && (
        <FormAlert>{state.message}</FormAlert>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="expense-description">Descrição</Label>
          <Input
            id="expense-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: Compra do supermercado"
            aria-invalid={Boolean(descriptionError)}
            aria-describedby={
              descriptionError ? "expense-description-error" : undefined
            }
            required
          />
          <FieldError
            id="expense-description-error"
            messages={descriptionError}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expense-total">Valor total</Label>
          <Input
            id="expense-total"
            name="totalAmount"
            inputMode="decimal"
            value={totalAmount}
            onChange={(event) => setTotalAmount(event.target.value)}
            placeholder="0,00"
            aria-invalid={Boolean(totalError)}
            aria-describedby={totalError ? "expense-total-error" : undefined}
            required
          />
          <FieldError id="expense-total-error" messages={totalError} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expense-date">Data</Label>
          <Input
            id="expense-date"
            name="expenseDate"
            type="date"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
            aria-invalid={Boolean(dateError)}
            aria-describedby={dateError ? "expense-date-error" : undefined}
            required
          />
          <FieldError id="expense-date-error" messages={dateError} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="expense-payer">Pago por</Label>
          <Select
            id="expense-payer"
            name="paidBy"
            value={paidBy}
            onChange={(event) => setPaidBy(event.target.value)}
            aria-invalid={Boolean(payerError)}
            aria-describedby={payerError ? "expense-payer-error" : undefined}
            required
          >
            {context.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </Select>
          <FieldError id="expense-payer-error" messages={payerError} />
        </div>
      </div>

      <SplitMethodSelector
        value={splitMethod}
        onChange={changeMethod}
        disabled={pending}
      />

      <fieldset className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <legend className="text-sm font-medium">Participantes</legend>
            <p className="text-meta text-neutral-500">
              O pagador não precisa participar do rateio.
            </p>
          </div>
          {splitMethod !== "EQUAL" && selectedIds.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={redistribute}
            >
              Redistribuir igualmente
            </Button>
          )}
        </div>

        <div className="divide-y divide-border rounded-xl border border-border">
          {context.members.map((member) => {
            const selected = selectedIds.includes(member.id);
            const percentageError =
              state.fieldErrors?.[`percentage_${member.id}`];
            const fixedError = state.fieldErrors?.[`fixed_${member.id}`];

            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
              >
                <label className="flex min-w-0 flex-1 items-center gap-3">
                  <input
                    type="checkbox"
                    name="participantIds"
                    value={member.id}
                    checked={selected}
                    onChange={() => toggleParticipant(member.id)}
                    className="h-4 w-4 rounded border-border text-primary-600"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {member.name}
                    </span>
                    <span className="block truncate text-meta text-neutral-500">
                      {member.email}
                    </span>
                  </span>
                </label>

                {selected && splitMethod === "PERCENTAGE" && (
                  <div className="w-full sm:w-32">
                    <Label
                      htmlFor={`percentage-${member.id}`}
                      className="text-meta"
                    >
                      Percentual
                    </Label>
                    <Input
                      id={`percentage-${member.id}`}
                      name={`percentage_${member.id}`}
                      inputMode="decimal"
                      value={percentageInputs[member.id] ?? ""}
                      onChange={(event) =>
                        setPercentageInputs((current) => ({
                          ...current,
                          [member.id]: event.target.value,
                        }))
                      }
                      placeholder="0,00"
                      aria-invalid={Boolean(percentageError)}
                      aria-describedby={
                        percentageError
                          ? `percentage-${member.id}-error`
                          : undefined
                      }
                      className="mt-1"
                    />
                    <FieldError
                      id={`percentage-${member.id}-error`}
                      messages={percentageError}
                    />
                  </div>
                )}

                {selected && splitMethod === "FIXED" && (
                  <div className="w-full sm:w-32">
                    <Label htmlFor={`fixed-${member.id}`} className="text-meta">
                      Valor
                    </Label>
                    <Input
                      id={`fixed-${member.id}`}
                      name={`fixed_${member.id}`}
                      inputMode="decimal"
                      value={fixedInputs[member.id] ?? ""}
                      onChange={(event) =>
                        setFixedInputs((current) => ({
                          ...current,
                          [member.id]: event.target.value,
                        }))
                      }
                      placeholder="0,00"
                      aria-invalid={Boolean(fixedError)}
                      aria-describedby={
                        fixedError ? `fixed-${member.id}-error` : undefined
                      }
                      className="mt-1"
                    />
                    <FieldError
                      id={`fixed-${member.id}-error`}
                      messages={fixedError}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <FieldError
          id="expense-participants-error"
          messages={participantsError}
        />
      </fieldset>

      <SplitPreview
        rows={previewRows}
        totalAmount={previewTotal}
        difference={previewDifference}
        error={previewError}
        valid={previewValid}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink
          href={
            initial
              ? `/groups/${context.groupId}/expenses/${initial.expenseId}`
              : `/groups/${context.groupId}/expenses`
          }
          variant="outline"
        >
          Cancelar
        </ButtonLink>
        <Button type="submit" loading={pending} disabled={!previewValid}>
          {mode === "create" ? "Salvar despesa" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

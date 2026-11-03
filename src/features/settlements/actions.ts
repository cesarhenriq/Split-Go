"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GroupAccessError } from "@/features/groups/server/group-access";
import { cancelSettlement } from "@/features/settlements/server/cancel-settlement";
import { confirmSettlement } from "@/features/settlements/server/confirm-settlement";
import { createSettlement } from "@/features/settlements/server/create-settlement";
import { SettlementDomainError } from "@/features/settlements/server/errors";
import {
  initialSettlementActionState,
  type SettlementActionState,
  type SettlementFormState,
} from "@/features/settlements/types";
import { requireUser } from "@/lib/auth/current-user";
import { parseAmountToCents } from "@/lib/money";
import {
  parseSettlementDate,
  settlementActionSchema,
  settlementPaymentSchema,
} from "@/lib/validation/settlements";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readableError(error: unknown): string {
  if (
    error instanceof SettlementDomainError ||
    error instanceof GroupAccessError
  ) {
    return error.message;
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

function revalidateSettlementPaths(groupId: string, settlementId?: string) {
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/dashboard`);
  revalidatePath(`/groups/${groupId}/balances`);
  revalidatePath(`/groups/${groupId}/expenses`);
  revalidatePath(`/groups/${groupId}/settlements`);
  revalidatePath(`/groups/${groupId}/settlements/pending`);
  revalidatePath(`/groups/${groupId}/statement`);

  if (settlementId) {
    revalidatePath(`/groups/${groupId}/settlements/${settlementId}`);
  }
}

export async function createSettlementAction(
  _previousState: SettlementFormState,
  formData: FormData,
): Promise<SettlementFormState> {
  const user = await requireUser();
  const parsed = settlementPaymentSchema.safeParse({
    groupId: formString(formData, "groupId"),
    receivedBy: formString(formData, "receivedBy"),
    amount: formString(formData, "amount"),
    paidAt: formString(formData, "paidAt"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let amount: bigint;

  try {
    amount = parseAmountToCents(parsed.data.amount);

    if (amount <= 0n) {
      throw new Error("O valor deve ser maior que zero.");
    }
  } catch (error) {
    return {
      status: "error",
      message: "Informe um valor válido.",
      fieldErrors: {
        amount: [error instanceof Error ? error.message : "Valor inválido."],
      },
    };
  }

  let settlement: { id: string };

  try {
    settlement = await createSettlement({
      groupId: parsed.data.groupId,
      actorId: user.id,
      receivedBy: parsed.data.receivedBy,
      amount,
      paidAt: parseSettlementDate(parsed.data.paidAt),
    });
  } catch (error) {
    if (
      error instanceof SettlementDomainError ||
      error instanceof GroupAccessError
    ) {
      const fieldErrors: Record<string, string[]> = {};

      if (error instanceof SettlementDomainError) {
        if (
          error.code === "INVALID_AMOUNT" ||
          error.code === "INSUFFICIENT_BALANCE"
        ) {
          fieldErrors.amount = [error.message];
        }

        if (error.code === "SELF_PAYMENT") {
          fieldErrors.receivedBy = [error.message];
        }

        if (error.code === "INVALID_DATE") {
          fieldErrors.paidAt = [error.message];
        }
      }

      return {
        status: "error",
        message: readableError(error),
        fieldErrors:
          Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      };
    }

    console.error("createSettlementAction failed", error);
    return {
      status: "error",
      message: "Não foi possível registrar o pagamento. Tente novamente.",
    };
  }

  revalidateSettlementPaths(parsed.data.groupId, settlement.id);
  redirect(`/groups/${parsed.data.groupId}/settlements/${settlement.id}`);
}

export async function confirmSettlementAction(
  _previousState: SettlementActionState = initialSettlementActionState,
  formData: FormData,
): Promise<SettlementActionState> {
  const user = await requireUser();
  const parsed = settlementActionSchema.safeParse({
    groupId: formString(formData, "groupId"),
    settlementId: formString(formData, "settlementId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Pagamento inválido." };
  }

  try {
    await confirmSettlement(
      parsed.data.groupId,
      parsed.data.settlementId,
      user.id,
    );
  } catch (error) {
    if (
      error instanceof SettlementDomainError ||
      error instanceof GroupAccessError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("confirmSettlementAction failed", error);
    return {
      status: "error",
      message: "Não foi possível confirmar o pagamento. Tente novamente.",
    };
  }

  revalidateSettlementPaths(parsed.data.groupId, parsed.data.settlementId);

  return {
    status: "success",
    message: "Recebimento confirmado. Os saldos foram atualizados.",
  };
}

export async function cancelSettlementAction(
  _previousState: SettlementActionState = initialSettlementActionState,
  formData: FormData,
): Promise<SettlementActionState> {
  const user = await requireUser();
  const parsed = settlementActionSchema.safeParse({
    groupId: formString(formData, "groupId"),
    settlementId: formString(formData, "settlementId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Pagamento inválido." };
  }

  try {
    await cancelSettlement(
      parsed.data.groupId,
      parsed.data.settlementId,
      user.id,
    );
  } catch (error) {
    if (
      error instanceof SettlementDomainError ||
      error instanceof GroupAccessError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("cancelSettlementAction failed", error);
    return {
      status: "error",
      message: "Não foi possível cancelar o pagamento. Tente novamente.",
    };
  }

  revalidateSettlementPaths(parsed.data.groupId, parsed.data.settlementId);

  return {
    status: "success",
    message: "Pagamento cancelado. O histórico foi preservado.",
  };
}

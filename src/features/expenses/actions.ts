"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SplitCalculationError } from "@/features/expenses/lib/split-calculator";
import { cancelExpense } from "@/features/expenses/server/cancel-expense";
import { createExpense } from "@/features/expenses/server/create-expense";
import { ExpenseDomainError } from "@/features/expenses/server/expense-access";
import { updateExpense } from "@/features/expenses/server/update-expense";
import {
  type ExpenseActionState,
  type ExpenseFormState,
  type ExpenseSplitInput,
  initialExpenseActionState,
} from "@/features/expenses/types";
import { GroupAccessError } from "@/features/groups/server/group-access";
import { requireUser } from "@/lib/auth/current-user";
import { parseAmountToCents, parsePercentageToBasisPoints } from "@/lib/money";
import {
  cancelExpenseSchema,
  expenseBaseSchema,
  parseExpenseDate,
  updateExpenseSchema,
} from "@/lib/validation/expenses";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readableError(error: unknown): string {
  if (
    error instanceof ExpenseDomainError ||
    error instanceof GroupAccessError ||
    error instanceof SplitCalculationError
  ) {
    return error.message;
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

type MethodSplitResult =
  | { ok: true; split: ExpenseSplitInput }
  | { ok: false; fieldErrors: Record<string, string[]>; message: string };

function parseMethodSplit(
  formData: FormData,
  method: "EQUAL" | "PERCENTAGE" | "FIXED",
  participantIds: string[],
): MethodSplitResult {
  if (method === "EQUAL") {
    return {
      ok: true,
      split: { method: "EQUAL", participantIds },
    };
  }

  const fieldErrors: Record<string, string[]> = {};

  if (method === "PERCENTAGE") {
    const participants = participantIds.map((userId) => {
      const raw = formString(formData, `percentage_${userId}`);

      try {
        return {
          userId,
          basisPoints: parsePercentageToBasisPoints(raw),
        };
      } catch (error) {
        fieldErrors[`percentage_${userId}`] = [
          error instanceof Error ? error.message : "Percentual inválido.",
        ];
        return { userId, basisPoints: 0 };
      }
    });

    if (Object.keys(fieldErrors).length > 0) {
      return {
        ok: false,
        fieldErrors,
        message: "Revise os percentuais informados.",
      };
    }

    return {
      ok: true,
      split: { method: "PERCENTAGE", participants },
    };
  }

  const participants = participantIds.map((userId) => {
    const raw = formString(formData, `fixed_${userId}`);

    try {
      return {
        userId,
        amount: parseAmountToCents(raw),
      };
    } catch (error) {
      fieldErrors[`fixed_${userId}`] = [
        error instanceof Error ? error.message : "Valor inválido.",
      ];
      return { userId, amount: 0n };
    }
  });

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      fieldErrors,
      message: "Revise os valores individuais.",
    };
  }

  return {
    ok: true,
    split: { method: "FIXED", participants },
  };
}

function revalidateExpensePaths(groupId: string, expenseId?: string) {
  revalidatePath(`/groups/${groupId}/expenses`);
  revalidatePath(`/groups/${groupId}`);

  if (expenseId) {
    revalidatePath(`/groups/${groupId}/expenses/${expenseId}`);
  }
}

export async function createExpenseAction(
  _previousState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const user = await requireUser();
  const participantIds = formData
    .getAll("participantIds")
    .filter((value): value is string => typeof value === "string");

  const parsed = expenseBaseSchema.safeParse({
    groupId: formString(formData, "groupId"),
    description: formString(formData, "description"),
    totalAmount: formString(formData, "totalAmount"),
    expenseDate: formString(formData, "expenseDate"),
    paidBy: formString(formData, "paidBy"),
    splitMethod: formString(formData, "splitMethod"),
    participantIds,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let totalAmount: bigint;

  try {
    totalAmount = parseAmountToCents(parsed.data.totalAmount);

    if (totalAmount <= 0n) {
      throw new Error("O valor total deve ser maior que zero.");
    }
  } catch (error) {
    return {
      status: "error",
      message: "Informe um valor total válido.",
      fieldErrors: {
        totalAmount: [
          error instanceof Error ? error.message : "Valor inválido.",
        ],
      },
    };
  }

  const methodSplit = parseMethodSplit(
    formData,
    parsed.data.splitMethod,
    parsed.data.participantIds,
  );

  if (!methodSplit.ok) {
    return {
      status: "error",
      message: methodSplit.message,
      fieldErrors: methodSplit.fieldErrors,
    };
  }

  let expense: { id: string };

  try {
    expense = await createExpense({
      groupId: parsed.data.groupId,
      actorId: user.id,
      paidBy: parsed.data.paidBy,
      description: parsed.data.description,
      totalAmount,
      expenseDate: parseExpenseDate(parsed.data.expenseDate),
      split: methodSplit.split,
    });
  } catch (error) {
    if (
      error instanceof ExpenseDomainError ||
      error instanceof GroupAccessError ||
      error instanceof SplitCalculationError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("createExpenseAction failed", error);
    return {
      status: "error",
      message: "Não foi possível criar a despesa. Tente novamente.",
    };
  }

  revalidateExpensePaths(parsed.data.groupId, expense.id);
  redirect(`/groups/${parsed.data.groupId}/expenses/${expense.id}`);
}

export async function updateExpenseAction(
  _previousState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const user = await requireUser();
  const participantIds = formData
    .getAll("participantIds")
    .filter((value): value is string => typeof value === "string");

  const parsed = updateExpenseSchema.safeParse({
    groupId: formString(formData, "groupId"),
    expenseId: formString(formData, "expenseId"),
    description: formString(formData, "description"),
    totalAmount: formString(formData, "totalAmount"),
    expenseDate: formString(formData, "expenseDate"),
    paidBy: formString(formData, "paidBy"),
    splitMethod: formString(formData, "splitMethod"),
    participantIds,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let totalAmount: bigint;

  try {
    totalAmount = parseAmountToCents(parsed.data.totalAmount);

    if (totalAmount <= 0n) {
      throw new Error("O valor total deve ser maior que zero.");
    }
  } catch (error) {
    return {
      status: "error",
      message: "Informe um valor total válido.",
      fieldErrors: {
        totalAmount: [
          error instanceof Error ? error.message : "Valor inválido.",
        ],
      },
    };
  }

  const methodSplit = parseMethodSplit(
    formData,
    parsed.data.splitMethod,
    parsed.data.participantIds,
  );

  if (!methodSplit.ok) {
    return {
      status: "error",
      message: methodSplit.message,
      fieldErrors: methodSplit.fieldErrors,
    };
  }

  try {
    await updateExpense({
      expenseId: parsed.data.expenseId,
      groupId: parsed.data.groupId,
      actorId: user.id,
      paidBy: parsed.data.paidBy,
      description: parsed.data.description,
      totalAmount,
      expenseDate: parseExpenseDate(parsed.data.expenseDate),
      split: methodSplit.split,
    });
  } catch (error) {
    if (
      error instanceof ExpenseDomainError ||
      error instanceof GroupAccessError ||
      error instanceof SplitCalculationError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("updateExpenseAction failed", error);
    return {
      status: "error",
      message: "Não foi possível atualizar a despesa. Tente novamente.",
    };
  }

  revalidateExpensePaths(parsed.data.groupId, parsed.data.expenseId);
  redirect(`/groups/${parsed.data.groupId}/expenses/${parsed.data.expenseId}`);
}

export async function cancelExpenseAction(
  _previousState: ExpenseActionState = initialExpenseActionState,
  formData: FormData,
): Promise<ExpenseActionState> {
  const user = await requireUser();
  const parsed = cancelExpenseSchema.safeParse({
    groupId: formString(formData, "groupId"),
    expenseId: formString(formData, "expenseId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Despesa inválida." };
  }

  try {
    await cancelExpense(parsed.data.groupId, parsed.data.expenseId, user.id);
  } catch (error) {
    if (
      error instanceof ExpenseDomainError ||
      error instanceof GroupAccessError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("cancelExpenseAction failed", error);
    return {
      status: "error",
      message: "Não foi possível cancelar a despesa.",
    };
  }

  revalidateExpensePaths(parsed.data.groupId, parsed.data.expenseId);

  return { status: "success", message: "Despesa cancelada." };
}

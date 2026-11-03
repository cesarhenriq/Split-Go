import { z } from "zod";
import { isValidExpenseDate } from "./expenses";

export const settlementIdSchema = z.uuid("Pagamento inválido.");
export const settlementGroupIdSchema = z.uuid("Grupo inválido.");

export const settlementActionSchema = z.object({
  groupId: settlementGroupIdSchema,
  settlementId: settlementIdSchema,
});

export const settlementPaymentSchema = z.object({
  groupId: settlementGroupIdSchema,
  receivedBy: z.uuid("Selecione quem recebeu."),
  amount: z.string().min(1, "Informe o valor."),
  paidAt: z.string().refine(isValidExpenseDate, "Informe uma data válida."),
});

export function parseSettlementDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export const settlementStatusFilterSchema = z
  .enum(["all", "PENDING", "CONFIRMED", "CANCELLED"])
  .optional()
  .default("all");

export const statementFiltersSchema = z.object({
  from: z
    .string()
    .optional()
    .default("")
    .refine((value) => !value || isValidExpenseDate(value), "Data inválida."),
  to: z
    .string()
    .optional()
    .default("")
    .refine((value) => !value || isValidExpenseDate(value), "Data inválida."),
  type: z
    .enum(["all", "expenses", "sent", "received"])
    .optional()
    .default("all"),
  status: z
    .enum(["all", "PENDING", "CONFIRMED", "CANCELLED"])
    .optional()
    .default("all"),
});

export type StatementFilters = z.infer<typeof statementFiltersSchema>;

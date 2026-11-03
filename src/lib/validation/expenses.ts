import { z } from "zod";

export const expenseIdSchema = z.uuid("Despesa inválida.");
export const expenseGroupIdSchema = z.uuid("Grupo inválido.");

export const expenseDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Informe uma descrição.")
  .max(255, "A descrição deve ter no máximo 255 caracteres.");

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function isValidExpenseDate(value: string): boolean {
  if (!datePattern.test(value)) return false;

  const date = new Date(`${value}T12:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function parseExpenseDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

export const expenseDateSchema = z
  .string()
  .refine(isValidExpenseDate, "Informe uma data válida.");

export const expenseBaseSchema = z.object({
  groupId: expenseGroupIdSchema,
  description: expenseDescriptionSchema,
  totalAmount: z.string().min(1, "Informe o valor total."),
  expenseDate: expenseDateSchema,
  paidBy: z.uuid("Selecione o pagador."),
  splitMethod: z.enum(["EQUAL", "PERCENTAGE", "FIXED"]),
  participantIds: z
    .array(z.uuid("Participante inválido."))
    .min(1, "Selecione pelo menos um participante.")
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Não repita participantes.",
    ),
});

export const updateExpenseSchema = expenseBaseSchema.extend({
  expenseId: expenseIdSchema,
});

export const cancelExpenseSchema = z.object({
  groupId: expenseGroupIdSchema,
  expenseId: expenseIdSchema,
});

export const expenseFiltersSchema = z.object({
  description: z.string().trim().max(255).optional().default(""),
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
  paidBy: z.string().optional().default(""),
  includeCancelled: z
    .union([
      z.boolean(),
      z.literal("on"),
      z.literal("true"),
      z.literal("false"),
      z.undefined(),
    ])
    .optional()
    .transform((value) => value === true || value === "on" || value === "true"),
  page: z.coerce.number().int().min(1).optional().default(1),
});

export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;

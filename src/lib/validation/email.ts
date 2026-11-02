import { z } from "zod";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeEmail(value) : value),
  z
    .string()
    .max(320, "O e-mail deve ter no máximo 320 caracteres.")
    .pipe(z.email("Informe um e-mail válido.")),
);

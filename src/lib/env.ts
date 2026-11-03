import { z } from "zod";

const urlSchema = z.url("Informe uma URL válida.");

export function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();

  if (!value) {
    throw new Error("DATABASE_URL is not defined");
  }

  const parsed = urlSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error("DATABASE_URL must be a valid URL");
  }

  return parsed.data;
}

export function getPoolMax(): number {
  const parsed = z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .safeParse(process.env.DB_POOL_MAX ?? "5");

  if (!parsed.success) {
    throw new Error("DB_POOL_MAX must be an integer between 1 and 20");
  }

  return parsed.data;
}

export function getAppUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_APP_URL must be defined in production");
    }

    return "http://localhost:3000";
  }

  const parsed = urlSchema.safeParse(value);

  if (!parsed.success) {
    throw new Error("NEXT_PUBLIC_APP_URL must be a valid URL");
  }

  return parsed.data.replace(/\/$/, "");
}

import { describe, expect, it } from "vitest";
import { emailSchema, normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it("remove espaços e converte para minúsculas", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });
});

describe("emailSchema", () => {
  it("normaliza e aceita e-mail válido", () => {
    expect(emailSchema.parse("  USER@Example.COM ")).toBe("user@example.com");
  });

  it("rejeita e-mail inválido", () => {
    expect(() => emailSchema.parse("nao-e-email")).toThrow("e-mail válido");
  });

  it("rejeita e-mail acima de 320 caracteres", () => {
    const localPart = "a".repeat(310);

    expect(() => emailSchema.parse(`${localPart}@example.com`)).toThrow(
      "320 caracteres",
    );
  });
});

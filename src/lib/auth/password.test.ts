import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("gera hash Argon2id diferente da senha original", async () => {
    const password = "senha-segura-123";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toBe(password);
    expect(passwordHash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(passwordHash, password)).toBe(true);
  });

  it("rejeita senha incorreta", async () => {
    const passwordHash = await hashPassword("senha-correta");

    expect(await verifyPassword(passwordHash, "senha-incorreta")).toBe(false);
  });

  it("retorna false para hash inválido", async () => {
    expect(await verifyPassword("hash-invalido", "senha")).toBe(false);
  });
});

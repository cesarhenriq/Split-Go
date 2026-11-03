import { describe, expect, it } from "vitest";
import {
  loginSchema,
  passwordSchema,
  profileSchema,
  registerSchema,
} from "./auth";

const validRegistration = {
  name: "  Ana Silva  ",
  email: "  ANA@Example.COM ",
  password: "senha-segura-123",
  confirmPassword: "senha-segura-123",
};

describe("registerSchema", () => {
  it("normaliza nome e e-mail", () => {
    const parsed = registerSchema.parse(validRegistration);

    expect(parsed.name).toBe("Ana Silva");
    expect(parsed.email).toBe("ana@example.com");
  });

  it("rejeita senhas diferentes", () => {
    const parsed = registerSchema.safeParse({
      ...validRegistration,
      confirmPassword: "outra-senha",
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.confirmPassword).toEqual([
        "As senhas não coincidem.",
      ]);
    }
  });

  it("rejeita nome curto e e-mail inválido", () => {
    expect(
      registerSchema.safeParse({
        ...validRegistration,
        name: "A",
        email: "nao-e-email",
      }).success,
    ).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("aceita senha entre 8 e 128 caracteres", () => {
    expect(passwordSchema.parse("12345678")).toBe("12345678");
    expect(passwordSchema.parse("a".repeat(128))).toHaveLength(128);
  });

  it("rejeita senha curta e longa", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("normaliza o e-mail", () => {
    const parsed = loginSchema.parse({
      email: "  USER@Example.COM ",
      password: "senha",
    });

    expect(parsed.email).toBe("user@example.com");
  });

  it("rejeita senha vazia", () => {
    expect(
      loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      }).success,
    ).toBe(false);
  });
});

describe("profileSchema", () => {
  it("normaliza nome e e-mail do perfil", () => {
    const parsed = profileSchema.parse({
      name: "  Bruno Costa ",
      email: " BRUNO@Example.COM ",
    });

    expect(parsed).toEqual({
      name: "Bruno Costa",
      email: "bruno@example.com",
    });
  });
});

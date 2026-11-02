import { describe, expect, it } from "vitest";
import { formatCents, parseCents, serializeCents } from "./money";

describe("parseCents", () => {
  it("aceita bigint, número inteiro e string de dígitos", () => {
    expect(parseCents(100n)).toBe(100n);
    expect(parseCents(100)).toBe(100n);
    expect(parseCents(" 100 ")).toBe(100n);
    expect(parseCents("-50")).toBe(-50n);
  });

  it("rejeita números não inteiros e strings com separadores", () => {
    expect(() => parseCents(1.5)).toThrow("inteiros seguros");
    expect(() => parseCents("1,50")).toThrow("inteiros sem separadores");
    expect(() => parseCents("1.50")).toThrow("inteiros sem separadores");
  });
});

describe("serializeCents", () => {
  it("serializa bigint como string", () => {
    expect(serializeCents(12345n)).toBe("12345");
  });
});

describe("formatCents", () => {
  it("formata centavos em BRL", () => {
    expect(formatCents(12345n)).toContain("123,45");
    expect(formatCents(5n)).toContain("0,05");
    expect(formatCents(0n)).toContain("0,00");
    expect(formatCents("100")).toContain("1,00");
  });

  it("formata valores negativos", () => {
    const formatted = formatCents(-123456n);

    expect(formatted.startsWith("-")).toBe(true);
    expect(formatted).toContain("1.234,56");
  });
});

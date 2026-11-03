import { describe, expect, it } from "vitest";
import {
  formatBasisPoints,
  formatCents,
  formatCentsInput,
  formatPercentageInput,
  parseAmountToCents,
  parseCents,
  parsePercentageToBasisPoints,
  serializeCents,
} from "./money";

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

describe("parseAmountToCents", () => {
  it("converte formatos brasileiros e decimais em centavos", () => {
    expect(parseAmountToCents("100")).toBe(10000n);
    expect(parseAmountToCents("100,00")).toBe(10000n);
    expect(parseAmountToCents("1.234,56")).toBe(123456n);
    expect(parseAmountToCents("R$ 25,50")).toBe(2550n);
    expect(parseAmountToCents("25.50")).toBe(2550n);
    expect(parseAmountToCents("0,01")).toBe(1n);
  });

  it("rejeita formatos inválidos e negativos", () => {
    expect(() => parseAmountToCents("")).toThrow();
    expect(() => parseAmountToCents("1,234")).toThrow();
    expect(() => parseAmountToCents("-10,00")).toThrow();
    expect(() => parseAmountToCents("abc")).toThrow();
  });
});

describe("percentuais", () => {
  it("converte percentuais em basis points", () => {
    expect(parsePercentageToBasisPoints("33,33")).toBe(3333);
    expect(parsePercentageToBasisPoints("50%")).toBe(5000);
    expect(parsePercentageToBasisPoints("100")).toBe(10000);
  });

  it("rejeita percentuais inválidos", () => {
    expect(() => parsePercentageToBasisPoints("100,01")).toThrow();
    expect(() => parsePercentageToBasisPoints("-1")).toThrow();
    expect(() => parsePercentageToBasisPoints("33,333")).toThrow();
  });

  it("formata basis points e entradas", () => {
    expect(formatBasisPoints(3333)).toBe("33,33%");
    expect(formatPercentageInput(50)).toBe("50,00");
    expect(formatCentsInput(123456n)).toBe("1234,56");
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

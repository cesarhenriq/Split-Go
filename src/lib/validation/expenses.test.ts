import { describe, expect, it } from "vitest";
import {
  expenseBaseSchema,
  expenseFiltersSchema,
  isValidExpenseDate,
  parseExpenseDate,
} from "./expenses";

describe("expense date", () => {
  it("valida e converte datas", () => {
    expect(isValidExpenseDate("2026-11-02")).toBe(true);
    expect(isValidExpenseDate("2026-02-30")).toBe(false);
    expect(isValidExpenseDate("02/11/2026")).toBe(false);
    expect(parseExpenseDate("2026-11-02").toISOString()).toBe(
      "2026-11-02T12:00:00.000Z",
    );
  });
});

describe("expenseBaseSchema", () => {
  const valid = {
    groupId: "4afc5fab-4a31-4a89-aa0c-860a889023be",
    description: "Supermercado",
    totalAmount: "300,00",
    expenseDate: "2026-11-02",
    paidBy: "4afc5fab-4a31-4a89-aa0c-860a889023be",
    splitMethod: "EQUAL" as const,
    participantIds: ["4afc5fab-4a31-4a89-aa0c-860a889023be"],
  };

  it("aceita despesa válida", () => {
    expect(expenseBaseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita descrição vazia", () => {
    expect(
      expenseBaseSchema.safeParse({ ...valid, description: " " }).success,
    ).toBe(false);
  });

  it("rejeita participantes duplicados", () => {
    expect(
      expenseBaseSchema.safeParse({
        ...valid,
        participantIds: [valid.paidBy, valid.paidBy],
      }).success,
    ).toBe(false);
  });

  it("rejeita data inválida", () => {
    expect(
      expenseBaseSchema.safeParse({ ...valid, expenseDate: "2026-13-01" })
        .success,
    ).toBe(false);
  });
});

describe("expenseFiltersSchema", () => {
  it("normaliza filtros vazios", () => {
    const filters = expenseFiltersSchema.parse({});

    expect(filters).toMatchObject({
      description: "",
      from: "",
      to: "",
      paidBy: "",
      includeCancelled: false,
      page: 1,
    });
  });

  it("rejeita data de filtro inválida", () => {
    expect(expenseFiltersSchema.safeParse({ from: "2026-02-30" }).success).toBe(
      false,
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  parseSettlementDate,
  settlementActionSchema,
  settlementPaymentSchema,
  settlementStatusFilterSchema,
  statementFiltersSchema,
} from "./settlements";

const groupId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";
const settlementId = "33333333-3333-4333-8333-333333333333";

describe("settlementPaymentSchema", () => {
  it("aceita pagamento válido", () => {
    const parsed = settlementPaymentSchema.parse({
      groupId,
      receivedBy: userId,
      amount: "10,50",
      paidAt: "2026-10-01",
    });

    expect(parsed).toMatchObject({ groupId, receivedBy: userId });
  });

  it("rejeita UUIDs inválidos", () => {
    expect(
      settlementPaymentSchema.safeParse({
        groupId: "grupo",
        receivedBy: userId,
        amount: "10,50",
        paidAt: "2026-10-01",
      }).success,
    ).toBe(false);
  });

  it("rejeita data e valor vazios", () => {
    expect(
      settlementPaymentSchema.safeParse({
        groupId,
        receivedBy: userId,
        amount: "",
        paidAt: "2026-02-30",
      }).success,
    ).toBe(false);
  });
});

describe("settlementActionSchema", () => {
  it("aceita ação válida", () => {
    expect(
      settlementActionSchema.parse({ groupId, settlementId }),
    ).toMatchObject({ groupId, settlementId });
  });

  it("rejeita pagamento inválido", () => {
    expect(
      settlementActionSchema.safeParse({
        groupId,
        settlementId: "pagamento",
      }).success,
    ).toBe(false);
  });
});

describe("parseSettlementDate", () => {
  it("interpreta a data como início do dia UTC", () => {
    expect(parseSettlementDate("2026-10-01").toISOString()).toBe(
      "2026-10-01T00:00:00.000Z",
    );
  });
});

describe("statementFiltersSchema", () => {
  it("aplica defaults", () => {
    expect(statementFiltersSchema.parse({})).toEqual({
      from: "",
      to: "",
      type: "all",
      status: "all",
    });
  });

  it("aceita filtros válidos", () => {
    expect(
      statementFiltersSchema.parse({
        from: "2026-10-01",
        to: "2026-10-31",
        type: "sent",
        status: "PENDING",
      }),
    ).toMatchObject({
      from: "2026-10-01",
      to: "2026-10-31",
      type: "sent",
      status: "PENDING",
    });
  });

  it("rejeita tipo, status e data inválidos", () => {
    expect(statementFiltersSchema.safeParse({ type: "transfer" }).success).toBe(
      false,
    );
    expect(statementFiltersSchema.safeParse({ status: "OPEN" }).success).toBe(
      false,
    );
    expect(
      statementFiltersSchema.safeParse({ from: "2026-13-01" }).success,
    ).toBe(false);
  });
});

describe("settlementStatusFilterSchema", () => {
  it("usa all quando ausente", () => {
    expect(settlementStatusFilterSchema.parse(undefined)).toBe("all");
  });

  it("aceita status do enum", () => {
    expect(settlementStatusFilterSchema.parse("CONFIRMED")).toBe("CONFIRMED");
  });
});

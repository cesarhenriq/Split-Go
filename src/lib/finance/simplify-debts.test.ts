import { describe, expect, it } from "vitest";
import { applySettlementSuggestions } from "./calculate-balances";
import { FinanceIntegrityError } from "./finance-errors";
import type { MemberBalance } from "./finance-types";
import { simplifyDebts } from "./simplify-debts";

function member(userId: string, name: string, balance: bigint): MemberBalance {
  return {
    userId,
    name,
    email: `${userId}@example.com`,
    isActiveMember: true,
    totalPaid: balance > 0n ? balance : 0n,
    totalOwed: balance < 0n ? -balance : 0n,
    totalSent: 0n,
    totalReceived: 0n,
    balance,
  };
}

function expectBalancesZero(
  balances: MemberBalance[],
  suggestions: ReturnType<typeof simplifyDebts>,
) {
  const working = applySettlementSuggestions(balances, suggestions);

  for (const value of working.values()) {
    expect(value).toBe(0n);
  }
}

describe("simplifyDebts", () => {
  it("gera uma transferência entre um credor e um devedor", () => {
    const balances = [member("a", "Ana", 5000n), member("b", "Bruno", -5000n)];
    const suggestions = simplifyDebts(balances);

    expect(suggestions).toEqual([
      {
        fromUserId: "b",
        fromName: "Bruno",
        toUserId: "a",
        toName: "Ana",
        amount: 5000n,
      },
    ]);
    expectBalancesZero(balances, suggestions);
  });

  it("resolve um credor com vários devedores", () => {
    const balances = [
      member("a", "Ana", 10000n),
      member("b", "Bruno", -4000n),
      member("c", "Carlos", -6000n),
    ];
    const suggestions = simplifyDebts(balances);

    expect(suggestions).toHaveLength(2);
    expect(suggestions.reduce((total, item) => total + item.amount, 0n)).toBe(
      10000n,
    );
    expectBalancesZero(balances, suggestions);
  });

  it("resolve vários credores e vários devedores", () => {
    const balances = [
      member("a", "Ana", 10000n),
      member("b", "Bruno", 5000n),
      member("c", "Carlos", -8000n),
      member("d", "Daniela", -7000n),
    ];
    const suggestions = simplifyDebts(balances);

    expect(suggestions).toHaveLength(3);
    expect(suggestions.reduce((total, item) => total + item.amount, 0n)).toBe(
      15000n,
    );
    expectBalancesZero(balances, suggestions);
  });

  it("resolve cenário em cadeia sem transferências intermediárias", () => {
    const balances = [
      member("a", "Ana", -5000n),
      member("b", "Bruno", 0n),
      member("c", "Carlos", 5000n),
    ];
    const suggestions = simplifyDebts(balances);

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]).toMatchObject({
      fromUserId: "a",
      toUserId: "c",
      amount: 5000n,
    });
  });

  it("não gera transferências quando todos estão zerados", () => {
    expect(
      simplifyDebts([member("a", "Ana", 0n), member("b", "Bruno", 0n)]),
    ).toEqual([]);
  });

  it("preserva valores de 1 centavo", () => {
    const balances = [member("a", "Ana", 1n), member("b", "Bruno", -1n)];
    const suggestions = simplifyDebts(balances);

    expect(suggestions[0].amount).toBe(1n);
    expectBalancesZero(balances, suggestions);
  });

  it("é determinístico", () => {
    const balances = [
      member("a", "Ana", 3000n),
      member("b", "Bruno", 3000n),
      member("c", "Carlos", -3000n),
      member("d", "Daniela", -3000n),
    ];

    expect(simplifyDebts(balances)).toEqual(simplifyDebts(balances));
  });

  it("não gera pagamento para si mesmo nem valores inválidos", () => {
    const balances = [member("a", "Ana", 1000n), member("b", "Bruno", -1000n)];
    const suggestions = simplifyDebts(balances);

    for (const suggestion of suggestions) {
      expect(suggestion.fromUserId).not.toBe(suggestion.toUserId);
      expect(suggestion.amount).toBeGreaterThan(0n);
    }
  });

  it("rejeita saldos cuja soma não é zero", () => {
    expect(() =>
      simplifyDebts([member("a", "Ana", 1000n), member("b", "Bruno", -999n)]),
    ).toThrow(FinanceIntegrityError);
  });

  it("garante que ninguém paga mais do que deve", () => {
    const balances = [
      member("a", "Ana", 7000n),
      member("b", "Bruno", -2000n),
      member("c", "Carlos", -5000n),
    ];
    const suggestions = simplifyDebts(balances);

    for (const suggestion of suggestions) {
      const debtor = balances.find(
        (item) => item.userId === suggestion.fromUserId,
      );
      expect(suggestion.amount).toBeLessThanOrEqual(-(debtor?.balance ?? 0n));
    }
    expectBalancesZero(balances, suggestions);
  });
});

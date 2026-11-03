import { describe, expect, it } from "vitest";
import { calculateGroupBalances } from "./calculate-balances";
import { FinanceIntegrityError } from "./finance-errors";
import type { BalanceExpenseInput, BalanceMemberInput } from "./finance-types";

const members: BalanceMemberInput[] = [
  {
    userId: "a",
    name: "Ana",
    email: "ana@example.com",
    isActiveMember: true,
  },
  {
    userId: "b",
    name: "Bruno",
    email: "bruno@example.com",
    isActiveMember: true,
  },
  {
    userId: "c",
    name: "Carlos",
    email: "carlos@example.com",
    isActiveMember: true,
  },
];

function expense(
  overrides: Partial<BalanceExpenseInput> = {},
): BalanceExpenseInput {
  return {
    id: "expense-1",
    paidBy: "a",
    totalAmount: 30000n,
    cancelledAt: null,
    splits: [
      { userId: "a", shareAmount: 10000n },
      { userId: "b", shareAmount: 10000n },
      { userId: "c", shareAmount: 10000n },
    ],
    ...overrides,
  };
}

describe("calculateGroupBalances", () => {
  it("calcula o cenário de uma pessoa pagando tudo", () => {
    const balances = calculateGroupBalances([expense()], members);

    expect(balances).toEqual([
      expect.objectContaining({
        userId: "a",
        totalPaid: 30000n,
        totalOwed: 10000n,
        balance: 20000n,
      }),
      expect.objectContaining({
        userId: "b",
        totalPaid: 0n,
        totalOwed: 10000n,
        balance: -10000n,
      }),
      expect.objectContaining({
        userId: "c",
        totalPaid: 0n,
        totalOwed: 10000n,
        balance: -10000n,
      }),
    ]);
    expect(balances.reduce((total, item) => total + item.balance, 0n)).toBe(0n);
  });

  it("considera pagador fora do rateio", () => {
    const balances = calculateGroupBalances(
      [
        expense({
          totalAmount: 20000n,
          splits: [
            { userId: "b", shareAmount: 10000n },
            { userId: "c", shareAmount: 10000n },
          ],
        }),
      ],
      members,
    );

    expect(balances.find((item) => item.userId === "a")?.balance).toBe(20000n);
    expect(balances.find((item) => item.userId === "b")?.balance).toBe(-10000n);
  });

  it("soma múltiplas despesas e métodos diferentes", () => {
    const balances = calculateGroupBalances(
      [
        expense(),
        expense({
          id: "expense-2",
          paidBy: "b",
          totalAmount: 5000n,
          splits: [
            { userId: "a", shareAmount: 2500n },
            { userId: "b", shareAmount: 2500n },
          ],
        }),
      ],
      members,
    );

    expect(balances.find((item) => item.userId === "a")?.balance).toBe(17500n);
    expect(balances.find((item) => item.userId === "b")?.balance).toBe(-7500n);
    expect(balances.find((item) => item.userId === "c")?.balance).toBe(-10000n);
  });

  it("ignora despesas canceladas", () => {
    const balances = calculateGroupBalances(
      [expense({ cancelledAt: new Date() })],
      members,
    );

    expect(balances.every((item) => item.balance === 0n)).toBe(true);
  });

  it("inclui integrante sem despesas com saldo zero", () => {
    const balances = calculateGroupBalances(
      [
        expense({
          totalAmount: 100n,
          splits: [
            { userId: "a", shareAmount: 50n },
            { userId: "b", shareAmount: 50n },
          ],
        }),
      ],
      [
        ...members,
        {
          userId: "d",
          name: "Daniela",
          email: "daniela@example.com",
          isActiveMember: true,
        },
      ],
    );

    expect(balances.find((item) => item.userId === "d")?.balance).toBe(0n);
  });

  it("preserva precisão em centavos", () => {
    const balances = calculateGroupBalances(
      [
        expense({
          totalAmount: 10000n,
          splits: [
            { userId: "a", shareAmount: 3334n },
            { userId: "b", shareAmount: 3333n },
            { userId: "c", shareAmount: 3333n },
          ],
        }),
      ],
      members,
    );

    expect(balances.find((item) => item.userId === "a")?.balance).toBe(6666n);
    expect(balances.find((item) => item.userId === "b")?.balance).toBe(-3333n);
  });

  it("rejeita soma de splits diferente do total", () => {
    expect(() =>
      calculateGroupBalances(
        [
          expense({
            totalAmount: 30000n,
            splits: [{ userId: "a", shareAmount: 30000n - 1n }],
          }),
        ],
        members,
      ),
    ).toThrow(FinanceIntegrityError);
  });

  it("rejeita membro ausente", () => {
    expect(() =>
      calculateGroupBalances(
        [
          expense({
            splits: [
              { userId: "a", shareAmount: 10000n },
              { userId: "desconhecido", shareAmount: 20000n },
            ],
          }),
        ],
        members,
      ),
    ).toThrow(FinanceIntegrityError);
  });
});

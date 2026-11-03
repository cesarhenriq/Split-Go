import { describe, expect, it } from "vitest";
import { calculateGroupBalances } from "./calculate-balances";
import { FinanceIntegrityError } from "./finance-errors";
import type {
  BalanceExpenseInput,
  BalanceMemberInput,
  BalanceSettlementInput,
} from "./finance-types";

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

function settlement(
  overrides: Partial<BalanceSettlementInput> = {},
): BalanceSettlementInput {
  return {
    id: "settlement-1",
    paidBy: "b",
    receivedBy: "a",
    amount: 10000n,
    status: "CONFIRMED",
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

  it("ignora pagamentos pendentes e cancelados", () => {
    const pending = calculateGroupBalances([expense()], members, [
      settlement({ status: "PENDING" }),
    ]);
    const cancelled = calculateGroupBalances([expense()], members, [
      settlement({ status: "CANCELLED" }),
    ]);

    expect(pending.find((item) => item.userId === "b")?.balance).toBe(-10000n);
    expect(pending.find((item) => item.userId === "b")?.totalSent).toBe(0n);
    expect(cancelled.find((item) => item.userId === "a")?.balance).toBe(20000n);
    expect(cancelled.find((item) => item.userId === "a")?.totalReceived).toBe(
      0n,
    );
  });

  it("aplica pagamento confirmado reduzindo dívida e crédito", () => {
    const balances = calculateGroupBalances([expense()], members, [
      settlement(),
    ]);

    expect(balances.find((item) => item.userId === "a")).toEqual(
      expect.objectContaining({
        totalPaid: 30000n,
        totalOwed: 10000n,
        totalSent: 0n,
        totalReceived: 10000n,
        balance: 10000n,
      }),
    );
    expect(balances.find((item) => item.userId === "b")).toEqual(
      expect.objectContaining({
        totalPaid: 0n,
        totalOwed: 10000n,
        totalSent: 10000n,
        totalReceived: 0n,
        balance: 0n,
      }),
    );
    expect(balances.find((item) => item.userId === "c")?.balance).toBe(-10000n);
    expect(balances.reduce((total, item) => total + item.balance, 0n)).toBe(0n);
  });

  it("soma pagamentos parciais até a quitação", () => {
    const balances = calculateGroupBalances([expense()], members, [
      settlement({ id: "settlement-1", amount: 4000n }),
      settlement({ id: "settlement-2", amount: 6000n }),
    ]);

    expect(balances.find((item) => item.userId === "a")?.balance).toBe(10000n);
    expect(balances.find((item) => item.userId === "b")?.balance).toBe(0n);
    expect(balances.find((item) => item.userId === "b")?.totalSent).toBe(
      10000n,
    );
  });

  it("preserva centavos em pagamentos", () => {
    const balances = calculateGroupBalances([expense()], members, [
      settlement({ amount: 3333n }),
    ]);

    expect(balances.find((item) => item.userId === "a")?.balance).toBe(16667n);
    expect(balances.find((item) => item.userId === "b")?.balance).toBe(-6667n);
    expect(balances.reduce((total, item) => total + item.balance, 0n)).toBe(0n);
  });

  it("rejeita pagamento confirmado com valor inválido", () => {
    expect(() =>
      calculateGroupBalances([expense()], members, [
        settlement({ amount: 0n }),
      ]),
    ).toThrow(FinanceIntegrityError);
  });

  it("rejeita pagamento confirmado entre a mesma pessoa", () => {
    expect(() =>
      calculateGroupBalances([expense()], members, [
        settlement({ receivedBy: "b" }),
      ]),
    ).toThrow(FinanceIntegrityError);
  });

  it("rejeita pagamento confirmado com integrante ausente", () => {
    expect(() =>
      calculateGroupBalances([expense()], members, [
        settlement({ receivedBy: "desconhecido" }),
      ]),
    ).toThrow(FinanceIntegrityError);
  });
});

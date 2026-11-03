import { FinanceIntegrityError } from "./finance-errors";
import type {
  BalanceExpenseInput,
  BalanceMemberInput,
  MemberBalance,
} from "./finance-types";

export function calculateGroupBalances(
  expenses: BalanceExpenseInput[],
  members: BalanceMemberInput[],
): MemberBalance[] {
  const memberMap = new Map<string, MemberBalance>();

  for (const member of members) {
    memberMap.set(member.userId, {
      userId: member.userId,
      name: member.name,
      email: member.email,
      isActiveMember: member.isActiveMember,
      totalPaid: 0n,
      totalOwed: 0n,
      balance: 0n,
    });
  }

  for (const expense of expenses) {
    if (expense.cancelledAt !== null) {
      continue;
    }

    if (expense.totalAmount <= 0n) {
      throw new FinanceIntegrityError(
        "INVALID_TOTAL",
        "Foi encontrada uma despesa com valor inválido.",
      );
    }

    if (expense.splits.length === 0) {
      throw new FinanceIntegrityError(
        "MISSING_SPLITS",
        "Foi encontrada uma despesa sem rateios.",
      );
    }

    const payerBalance = memberMap.get(expense.paidBy);

    if (!payerBalance) {
      throw new FinanceIntegrityError(
        "MISSING_MEMBER",
        "O pagador de uma despesa não foi encontrado no grupo.",
      );
    }

    let splitTotal = 0n;

    for (const split of expense.splits) {
      if (split.shareAmount < 0n) {
        throw new FinanceIntegrityError(
          "INVALID_SPLIT_AMOUNT",
          "Foi encontrada uma parcela negativa.",
        );
      }

      const participant = memberMap.get(split.userId);

      if (!participant) {
        throw new FinanceIntegrityError(
          "MISSING_MEMBER",
          "Um participante de despesa não foi encontrado no grupo.",
        );
      }

      participant.totalOwed += split.shareAmount;
      splitTotal += split.shareAmount;
    }

    if (splitTotal !== expense.totalAmount) {
      throw new FinanceIntegrityError(
        "SPLIT_TOTAL_MISMATCH",
        "A soma dos rateios não corresponde ao total de uma despesa.",
      );
    }

    payerBalance.totalPaid += expense.totalAmount;
  }

  const balances = [...memberMap.values()].map((member) => ({
    ...member,
    balance: member.totalPaid - member.totalOwed,
  }));

  const totalBalance = balances.reduce(
    (total, member) => total + member.balance,
    0n,
  );

  if (totalBalance !== 0n) {
    throw new FinanceIntegrityError(
      "BALANCE_SUM_NOT_ZERO",
      "A soma dos saldos do grupo não é zero.",
    );
  }

  return balances.sort(
    (a, b) => a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId),
  );
}

export function applySettlementSuggestions(
  balances: MemberBalance[],
  suggestions: { fromUserId: string; toUserId: string; amount: bigint }[],
) {
  const working = new Map(
    balances.map((balance) => [balance.userId, balance.balance]),
  );

  for (const suggestion of suggestions) {
    const from = working.get(suggestion.fromUserId);
    const to = working.get(suggestion.toUserId);

    if (from === undefined || to === undefined) {
      throw new FinanceIntegrityError(
        "MISSING_MEMBER",
        "Uma transferência sugerida referencia um integrante inexistente.",
      );
    }

    working.set(suggestion.fromUserId, from + suggestion.amount);
    working.set(suggestion.toUserId, to - suggestion.amount);
  }

  return working;
}

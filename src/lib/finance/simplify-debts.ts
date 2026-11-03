import { FinanceIntegrityError } from "./finance-errors";
import type { MemberBalance, SettlementSuggestion } from "./finance-types";

type RemainingBalance = {
  userId: string;
  name: string;
  remaining: bigint;
};

function compareRemaining(a: RemainingBalance, b: RemainingBalance) {
  if (a.remaining === b.remaining) {
    return a.userId.localeCompare(b.userId);
  }

  return a.remaining > b.remaining ? -1 : 1;
}

export function simplifyDebts(
  balances: MemberBalance[],
): SettlementSuggestion[] {
  const total = balances.reduce((sum, balance) => sum + balance.balance, 0n);

  if (total !== 0n) {
    throw new FinanceIntegrityError(
      "BALANCE_SUM_NOT_ZERO",
      "A soma dos saldos deve ser zero para gerar o plano.",
    );
  }

  const debtors = balances
    .filter((balance) => balance.balance < 0n)
    .map((balance) => ({
      userId: balance.userId,
      name: balance.name,
      remaining: -balance.balance,
    }))
    .sort(compareRemaining);

  const creditors = balances
    .filter((balance) => balance.balance > 0n)
    .map((balance) => ({
      userId: balance.userId,
      name: balance.name,
      remaining: balance.balance,
    }))
    .sort(compareRemaining);

  const totalDebt = debtors.reduce((sum, debtor) => sum + debtor.remaining, 0n);
  const totalCredit = creditors.reduce(
    (sum, creditor) => sum + creditor.remaining,
    0n,
  );

  if (totalDebt !== totalCredit) {
    throw new FinanceIntegrityError(
      "DEBT_CREDIT_MISMATCH",
      "O total devido não corresponde ao total a receber.",
    );
  }

  const suggestions: SettlementSuggestion[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    if (debtor.userId === creditor.userId) {
      throw new FinanceIntegrityError(
        "DEBT_CREDIT_MISMATCH",
        "Um integrante não pode pagar para si mesmo.",
      );
    }

    const amount =
      debtor.remaining < creditor.remaining
        ? debtor.remaining
        : creditor.remaining;

    if (amount <= 0n) {
      throw new FinanceIntegrityError(
        "DEBT_CREDIT_MISMATCH",
        "Uma transferência inválida foi gerada.",
      );
    }

    suggestions.push({
      fromUserId: debtor.userId,
      fromName: debtor.name,
      toUserId: creditor.userId,
      toName: creditor.name,
      amount,
    });

    debtor.remaining -= amount;
    creditor.remaining -= amount;

    if (debtor.remaining === 0n) debtorIndex += 1;
    if (creditor.remaining === 0n) creditorIndex += 1;
  }

  if (debtorIndex !== debtors.length || creditorIndex !== creditors.length) {
    throw new FinanceIntegrityError(
      "DEBT_CREDIT_MISMATCH",
      "Não foi possível zerar todos os saldos.",
    );
  }

  const suggestedTotal = suggestions.reduce(
    (sum, suggestion) => sum + suggestion.amount,
    0n,
  );

  if (suggestedTotal !== totalDebt) {
    throw new FinanceIntegrityError(
      "DEBT_CREDIT_MISMATCH",
      "O total das transferências não corresponde ao total devido.",
    );
  }

  return suggestions;
}

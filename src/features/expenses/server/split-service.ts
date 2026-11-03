import {
  type CalculatedShare,
  calculateEqualSplit,
  calculateFixedSplit,
  calculatePercentageSplitFromBasisPoints,
} from "@/features/expenses/lib/split-calculator";
import type { ExpenseSplitInput } from "@/features/expenses/types";

export function calculateExpenseSplits(
  totalAmount: bigint,
  input: ExpenseSplitInput,
): CalculatedShare[] {
  switch (input.method) {
    case "EQUAL":
      return calculateEqualSplit(
        totalAmount,
        input.participantIds.map((userId) => ({ userId })),
      );
    case "PERCENTAGE":
      return calculatePercentageSplitFromBasisPoints(
        totalAmount,
        input.participants,
      );
    case "FIXED":
      return calculateFixedSplit(
        totalAmount,
        input.participants.map((participant) => ({
          userId: participant.userId,
          amount: participant.amount,
        })),
      );
  }
}

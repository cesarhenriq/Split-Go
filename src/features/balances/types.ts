import type {
  MemberBalance,
  SettlementSuggestion,
} from "@/lib/finance/finance-types";

export type GroupBalancesView = {
  groupName: string;
  members: MemberBalance[];
  suggestions: SettlementSuggestion[];
  totalExpenses: bigint;
  totalPaid: bigint;
  totalOwed: bigint;
  totalToReceive: bigint;
  totalToPay: bigint;
  totalSuggested: bigint;
  creditorsCount: number;
  debtorsCount: number;
};

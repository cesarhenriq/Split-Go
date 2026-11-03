export type BalanceMemberInput = {
  userId: string;
  name: string;
  email: string;
  isActiveMember: boolean;
};

export type BalanceSplitInput = {
  userId: string;
  shareAmount: bigint;
};

export type BalanceExpenseInput = {
  id: string;
  paidBy: string;
  totalAmount: bigint;
  cancelledAt: Date | null;
  splits: BalanceSplitInput[];
};

export type MemberBalance = {
  userId: string;
  name: string;
  email: string;
  isActiveMember: boolean;
  totalPaid: bigint;
  totalOwed: bigint;
  balance: bigint;
};

export type SettlementSuggestion = {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: bigint;
};

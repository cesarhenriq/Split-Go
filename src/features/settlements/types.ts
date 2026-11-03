import type { GroupBalancesView } from "@/features/balances/types";

export type SettlementStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type SettlementListItem = {
  id: string;
  groupId: string;
  paidById: string;
  paidByName: string;
  receivedById: string;
  receivedByName: string;
  amount: string;
  status: SettlementStatus;
  paidAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  canConfirm: boolean;
  canCancel: boolean;
};

export type SettlementDetail = SettlementListItem & {
  cancelledByName: string | null;
};

export type SettlementCreditor = {
  userId: string;
  name: string;
  email: string;
  availableToReceive: string;
};

export type SettlementFormContext = {
  groupId: string;
  groupName: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvailableToPay: string;
  creditors: SettlementCreditor[];
  pendingCount: number;
};

export type SettlementFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type SettlementActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialSettlementFormState: SettlementFormState = {
  status: "idle",
};

export const initialSettlementActionState: SettlementActionState = {
  status: "idle",
};

export type FinancialStatus = "balanced" | "pending" | "partial" | "open";

export type FinancialDashboardView = {
  balances: GroupBalancesView;
  financialStatus: FinancialStatus;
  totalRegistered: bigint;
  totalConfirmed: bigint;
  totalPending: bigint;
  pendingCount: number;
  confirmedCount: number;
  cancelledCount: number;
  pendingSettlements: SettlementListItem[];
};

export type StatementExpenseRow = {
  expenseId: string;
  description: string;
  expenseDate: string;
  totalAmount: string;
  userShare: string;
  paidByName: string;
  userIsPayer: boolean;
};

export type StatementSettlementRow = {
  settlementId: string;
  direction: "sent" | "received";
  counterpartName: string;
  amount: string;
  status: SettlementStatus;
  paidAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
};

export type StatementView = {
  groupName: string;
  memberName: string;
  summary: {
    totalPaid: bigint;
    totalOwed: bigint;
    totalSent: bigint;
    totalReceived: bigint;
    balance: bigint;
    pendingSent: bigint;
    pendingReceived: bigint;
  };
  expenses: StatementExpenseRow[];
  settlements: StatementSettlementRow[];
};

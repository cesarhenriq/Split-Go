import type {
  CalculatedShare,
  SplitMethod,
} from "@/features/expenses/lib/split-calculator";

export type ExpenseSummary = {
  id: string;
  groupId: string;
  description: string;
  totalAmount: string;
  expenseDate: string;
  paidById: string;
  paidByName: string;
  createdById: string;
  createdByName: string;
  splitMethod: SplitMethod;
  participantCount: number;
  cancelledAt: string | null;
  createdAt: string;
};

export type ExpenseListResult = {
  items: ExpenseSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ExpenseSplitDetail = {
  userId: string;
  name: string;
  email: string;
  shareAmount: string;
  percentage: number | null;
};

export type ExpenseDetail = {
  id: string;
  groupId: string;
  groupName: string;
  description: string;
  totalAmount: string;
  expenseDate: string;
  paidById: string;
  paidByName: string;
  createdById: string;
  createdByName: string;
  splitMethod: SplitMethod;
  cancelledAt: string | null;
  cancelledByName: string | null;
  splits: ExpenseSplitDetail[];
  totalRated: string;
  difference: string;
  canEdit: boolean;
  canCancel: boolean;
};

export type ExpenseMember = {
  id: string;
  name: string;
  email: string;
};

export type ExpenseFormContext = {
  groupId: string;
  groupName: string;
  currentUserId: string;
  currentUserRole: "ADMIN" | "MEMBER";
  members: ExpenseMember[];
};

export type ExpenseFormParticipant = {
  userId: string;
  percentage: string | null;
  amount: string | null;
};

export type ExpenseFormInitial = {
  expenseId: string;
  description: string;
  totalAmount: string;
  expenseDate: string;
  paidBy: string;
  splitMethod: SplitMethod;
  participants: ExpenseFormParticipant[];
};

export type ExpenseFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type ExpenseActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialExpenseFormState: ExpenseFormState = {
  status: "idle",
};

export const initialExpenseActionState: ExpenseActionState = {
  status: "idle",
};

export type ExpenseSplitInput =
  | {
      method: "EQUAL";
      participantIds: string[];
    }
  | {
      method: "PERCENTAGE";
      participants: { userId: string; basisPoints: number }[];
    }
  | {
      method: "FIXED";
      participants: { userId: string; amount: bigint }[];
    };

export type CalculatedExpenseShares = CalculatedShare[];

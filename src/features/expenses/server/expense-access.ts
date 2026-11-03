export type ExpenseDomainErrorCode =
  | "EXPENSE_NOT_FOUND"
  | "EXPENSE_CANCELLED"
  | "EXPENSE_FORBIDDEN"
  | "EXPENSE_HAS_SETTLEMENTS"
  | "INVALID_PARTICIPANT";

export class ExpenseDomainError extends Error {
  readonly code: ExpenseDomainErrorCode;

  constructor(code: ExpenseDomainErrorCode, message: string) {
    super(message);
    this.name = "ExpenseDomainError";
    this.code = code;
  }
}

export function canManageExpense(
  createdBy: string,
  userId: string,
  role: "ADMIN" | "MEMBER",
): boolean {
  return createdBy === userId || role === "ADMIN";
}

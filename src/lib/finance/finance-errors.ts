export type FinanceIntegrityErrorCode =
  | "INVALID_TOTAL"
  | "INVALID_SPLIT_AMOUNT"
  | "MISSING_SPLITS"
  | "SPLIT_TOTAL_MISMATCH"
  | "MISSING_MEMBER"
  | "BALANCE_SUM_NOT_ZERO"
  | "DEBT_CREDIT_MISMATCH";

export class FinanceIntegrityError extends Error {
  readonly code: FinanceIntegrityErrorCode;

  constructor(code: FinanceIntegrityErrorCode, message: string) {
    super(message);
    this.name = "FinanceIntegrityError";
    this.code = code;
  }
}

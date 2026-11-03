export type SettlementDomainErrorCode =
  | "SETTLEMENT_NOT_FOUND"
  | "SETTLEMENT_NOT_PENDING"
  | "SELF_PAYMENT"
  | "INVALID_AMOUNT"
  | "INVALID_DATE"
  | "INSUFFICIENT_BALANCE"
  | "BALANCE_CHANGED"
  | "CONFIRM_NOT_ALLOWED"
  | "CANCEL_NOT_ALLOWED";

export class SettlementDomainError extends Error {
  readonly code: SettlementDomainErrorCode;

  constructor(code: SettlementDomainErrorCode, message: string) {
    super(message);
    this.name = "SettlementDomainError";
    this.code = code;
  }
}

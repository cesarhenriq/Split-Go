export type GroupDomainErrorCode =
  | "GROUP_NOT_FOUND"
  | "NOT_MEMBER"
  | "ADMIN_REQUIRED"
  | "TARGET_NOT_MEMBER"
  | "CANNOT_REMOVE_SELF"
  | "CANNOT_REMOVE_ADMIN"
  | "LAST_ADMIN"
  | "ALREADY_MEMBER"
  | "ALREADY_ADMIN"
  | "INVITATION_NOT_FOUND"
  | "INVITATION_NOT_PENDING"
  | "INVITATION_EXPIRED"
  | "INVITATION_EMAIL_MISMATCH";

export class GroupDomainError extends Error {
  readonly code: GroupDomainErrorCode;

  constructor(code: GroupDomainErrorCode, message: string) {
    super(message);
    this.name = "GroupDomainError";
    this.code = code;
  }
}

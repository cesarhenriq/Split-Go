export type GroupRole = "ADMIN" | "MEMBER";

export type InvitationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED";

export type GroupSummary = {
  id: string;
  name: string;
  description: string | null;
  creatorName: string;
  memberCount: number;
  createdAt: string;
};

export type GroupMemberSummary = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: GroupRole;
  joinedAt: string | null;
};

export type PendingInvitationSummary = {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

export type GroupDetail = {
  id: string;
  name: string;
  description: string | null;
  creatorName: string;
  createdAt: string;
  currentUserId: string;
  currentUserRole: GroupRole;
  members: GroupMemberSummary[];
  pendingInvitations: PendingInvitationSummary[];
};

export type ReceivedInvitation = {
  id: string;
  groupId: string;
  groupName: string;
  inviterName: string;
  email: string;
  status: InvitationStatus;
  displayStatus: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  canRespond: boolean;
};

export type InviteResultStatus =
  | "created"
  | "already-member"
  | "pending"
  | "self"
  | "error";

export type InviteDelivery = "not-configured" | "sent" | "failed";

export type InviteResult = {
  email: string;
  status: InviteResultStatus;
  message: string;
  delivery: InviteDelivery;
};

export type GroupFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: {
    name?: string;
    description?: string;
  };
};

export type InviteFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  results?: InviteResult[];
};

export type GroupActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialGroupFormState: GroupFormState = {
  status: "idle",
};

export const initialInviteFormState: InviteFormState = {
  status: "idle",
};

export const initialGroupActionState: GroupActionState = {
  status: "idle",
};

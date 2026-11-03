export type InvitationActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialInvitationActionState: InvitationActionState = {
  status: "idle",
};

export type InvitationDelivery = "sent" | "not-configured" | "failed";

export type InvitationNotification = {
  to: string;
  groupName: string;
  inviterName: string;
  token: string;
  expiresAt: Date;
};

export interface InvitationNotifier {
  sendInvitation(
    notification: InvitationNotification,
  ): Promise<InvitationDelivery>;
}

export const unavailableInvitationNotifier: InvitationNotifier = {
  async sendInvitation() {
    return "not-configured";
  },
};

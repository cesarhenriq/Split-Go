"use server";

import { revalidatePath } from "next/cache";
import { respondToInvitation } from "@/features/groups/server/respond-invitation";
import type { InvitationActionState } from "@/features/invitations/types";
import { requireUser } from "@/lib/auth/current-user";
import { invitationResponseSchema } from "@/lib/validation/groups";

const responseMessages = {
  NOT_FOUND: "Convite não encontrado.",
  EMAIL_MISMATCH: "Este convite foi enviado para outro e-mail.",
  NOT_PENDING: "Este convite já foi respondido.",
  EXPIRED: "Este convite expirou.",
  ALREADY_MEMBER: "Você já participa deste grupo.",
} as const;

export async function respondInvitationAction(
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const user = await requireUser();
  const invitationId = formData.get("invitationId");
  const decision = formData.get("decision");

  const parsed = invitationResponseSchema.safeParse({
    invitationId: typeof invitationId === "string" ? invitationId : "",
    decision: typeof decision === "string" ? decision : "",
  });

  if (!parsed.success) {
    return { status: "error", message: "Convite inválido." };
  }

  try {
    const result = await respondToInvitation({
      invitationId: parsed.data.invitationId,
      userId: user.id,
      userEmail: user.email,
      decision: parsed.data.decision,
    });

    if (!result.ok) {
      return { status: "error", message: responseMessages[result.code] };
    }

    revalidatePath("/invitations");
    revalidatePath("/groups");
    revalidatePath(`/groups/${result.groupId}`);
    revalidatePath("/", "layout");

    return {
      status: "success",
      message:
        result.decision === "ACCEPTED"
          ? "Convite aceito. Você agora participa do grupo."
          : "Convite recusado.",
    };
  } catch (error) {
    console.error("respondInvitationAction failed", error);

    return {
      status: "error",
      message: "Não foi possível responder ao convite. Tente novamente.",
    };
  }
}

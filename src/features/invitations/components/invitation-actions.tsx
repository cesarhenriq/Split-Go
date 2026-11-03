"use client";

import { Check, X } from "lucide-react";
import { useActionState } from "react";
import { FormAlert } from "@/components/feedback/form-alert";
import { Button } from "@/components/ui/button";
import { respondInvitationAction } from "@/features/invitations/actions";
import { initialInvitationActionState } from "@/features/invitations/types";

export type InvitationActionsProps = {
  invitationId: string;
};

export function InvitationActions({ invitationId }: InvitationActionsProps) {
  const [state, action, pending] = useActionState(
    respondInvitationAction,
    initialInvitationActionState,
  );

  function respond(decision: "accept" | "decline") {
    const formData = new FormData();
    formData.set("invitationId", invitationId);
    formData.set("decision", decision);
    action(formData);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          loading={pending}
          onClick={() => respond("accept")}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Aceitar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => respond("decline")}
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Recusar
        </Button>
      </div>

      {state.status !== "idle" && state.message && (
        <FormAlert tone={state.status === "success" ? "success" : "error"}>
          {state.message}
        </FormAlert>
      )}
    </div>
  );
}

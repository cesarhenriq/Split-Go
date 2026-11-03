"use client";

import { Check, X } from "lucide-react";
import { useActionState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();

  function respond(decision: "accept" | "decline") {
    const formData = new FormData();
    formData.set("invitationId", invitationId);
    formData.set("decision", decision);
    startTransition(() => {
      action(formData);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          loading={pending || isPending}
          onClick={() => respond("accept")}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Aceitar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || isPending}
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

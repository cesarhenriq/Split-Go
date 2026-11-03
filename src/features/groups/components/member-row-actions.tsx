"use client";

import { UserCheck, UserMinus } from "lucide-react";
import { useActionState, useState } from "react";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  promoteMemberAction,
  removeMemberAction,
} from "@/features/groups/actions";
import {
  type GroupMemberSummary,
  initialGroupActionState,
} from "@/features/groups/types";

export type MemberRowActionsProps = {
  groupId: string;
  member: GroupMemberSummary;
};

export function MemberRowActions({ groupId, member }: MemberRowActionsProps) {
  const [promoteState, promoteAction, promotePending] = useActionState(
    promoteMemberAction,
    initialGroupActionState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeMemberAction,
    initialGroupActionState,
  );
  const [removeOpen, setRemoveOpen] = useState(false);

  function runPromote() {
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("userId", member.userId);
    promoteAction(formData);
  }

  function runRemove() {
    const formData = new FormData();
    formData.set("groupId", groupId);
    formData.set("userId", member.userId);
    removeAction(formData);
  }

  const error =
    promoteState.status === "error"
      ? promoteState.message
      : removeState.status === "error"
        ? removeState.message
        : null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={promotePending}
          onClick={runPromote}
        >
          <UserCheck className="h-4 w-4" aria-hidden="true" />
          Tornar admin
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-danger-700 hover:bg-danger-50"
          onClick={() => setRemoveOpen(true)}
        >
          <UserMinus className="h-4 w-4" aria-hidden="true" />
          Remover
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-meta text-danger-600">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={`Remover ${member.name}?`}
        description="O integrante deixará de participar do grupo, mas o histórico será preservado."
        confirmLabel="Remover"
        tone="danger"
        loading={removePending}
        onConfirm={runRemove}
      />
    </div>
  );
}

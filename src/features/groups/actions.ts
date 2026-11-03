"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancelInvitation } from "@/features/groups/server/cancel-invitation";
import { createGroup } from "@/features/groups/server/create-group";
import { GroupDomainError } from "@/features/groups/server/errors";
import { GroupAccessError } from "@/features/groups/server/group-access";
import { inviteMembers } from "@/features/groups/server/invite-members";
import { leaveGroup } from "@/features/groups/server/leave-group";
import { promoteGroupMember } from "@/features/groups/server/promote-member";
import { removeGroupMember } from "@/features/groups/server/remove-member";
import { updateGroup } from "@/features/groups/server/update-group";
import type {
  GroupActionState,
  GroupFormState,
  InviteFormState,
} from "@/features/groups/types";
import { requireUser } from "@/lib/auth/current-user";
import { consumeRateLimit, hashRateLimitKey } from "@/lib/security/rate-limit";
import {
  isRateLimitDisabled,
  rateLimitPolicy,
} from "@/lib/security/rate-limit-policy";
import {
  cancelInvitationSchema,
  groupFormSchema,
  groupIdSchema,
  groupMemberActionSchema,
  inviteMembersSchema,
} from "@/lib/validation/groups";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function readableError(error: unknown): string {
  if (error instanceof GroupDomainError) {
    return error.message;
  }

  if (error instanceof GroupAccessError) {
    return error.message;
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

export async function createGroupAction(
  _previousState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const user = await requireUser();
  const values = {
    name: formString(formData, "name"),
    description: formString(formData, "description"),
  };

  const parsed = groupFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  let group: { id: string };

  try {
    group = await createGroup(
      {
        name: parsed.data.name,
        description: parsed.data.description,
      },
      user.id,
    );
  } catch (error) {
    console.error("createGroupAction failed", error);

    return {
      status: "error",
      message: "Não foi possível criar o grupo. Tente novamente.",
      values,
    };
  }

  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function updateGroupAction(
  _previousState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const user = await requireUser();
  const values = {
    name: formString(formData, "name"),
    description: formString(formData, "description"),
  };
  const groupId = groupIdSchema.safeParse(formString(formData, "groupId"));

  if (!groupId.success) {
    return { status: "error", message: "Grupo inválido.", values };
  }

  const parsed = groupFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    await updateGroup(groupId.data, user.id, {
      name: parsed.data.name,
      description: parsed.data.description,
    });
  } catch (error) {
    if (
      error instanceof GroupAccessError ||
      error instanceof GroupDomainError
    ) {
      return { status: "error", message: readableError(error), values };
    }

    console.error("updateGroupAction failed", error);
    return {
      status: "error",
      message: "Não foi possível atualizar o grupo. Tente novamente.",
      values,
    };
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId.data}`);

  return {
    status: "success",
    message: "Grupo atualizado com sucesso.",
    values,
  };
}

export async function inviteMembersAction(
  _previousState: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const user = await requireUser();
  const groupId = groupIdSchema.safeParse(formString(formData, "groupId"));
  const emails = formData
    .getAll("emails")
    .filter((value): value is string => typeof value === "string");

  if (!groupId.success) {
    return { status: "error", message: "Grupo inválido." };
  }

  const parsed = inviteMembersSchema.safeParse({
    groupId: groupId.data,
    emails,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os e-mails informados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isRateLimitDisabled()) {
    try {
      const limit = await consumeRateLimit({
        key: hashRateLimitKey("invite", user.id),
        ...rateLimitPolicy.invite,
      });

      if (!limit.allowed) {
        return {
          status: "error",
          message:
            "Muitos convites em pouco tempo. Aguarde alguns minutos e tente novamente.",
        };
      }
    } catch (error) {
      console.error("inviteMembersAction rate limit failed", error);

      return {
        status: "error",
        message: "Não foi possível processar os convites agora.",
      };
    }
  }

  try {
    const results = await inviteMembers({
      groupId: groupId.data,
      actorId: user.id,
      actorEmail: user.email,
      emails: parsed.data.emails,
    });

    revalidatePath(`/groups/${groupId.data}`);

    return {
      status: "success",
      message: "Processamento dos convites concluído.",
      results,
    };
  } catch (error) {
    if (
      error instanceof GroupAccessError ||
      error instanceof GroupDomainError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("inviteMembersAction failed", error);
    return {
      status: "error",
      message: "Não foi possível processar os convites. Tente novamente.",
    };
  }
}

export async function cancelInvitationAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const user = await requireUser();
  const parsed = cancelInvitationSchema.safeParse({
    groupId: formString(formData, "groupId"),
    invitationId: formString(formData, "invitationId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Convite inválido." };
  }

  try {
    const result = await cancelInvitation(
      parsed.data.groupId,
      parsed.data.invitationId,
      user.id,
    );

    if (!result.ok) {
      const messages = {
        NOT_FOUND: "Convite não encontrado.",
        NOT_PENDING: "Este convite não está mais pendente.",
        EXPIRED: "Este convite expirou e não pode ser cancelado.",
      } as const;

      return { status: "error", message: messages[result.code] };
    }

    revalidatePath(`/groups/${parsed.data.groupId}`);
    revalidatePath("/invitations");

    return { status: "success", message: "Convite cancelado." };
  } catch (error) {
    if (
      error instanceof GroupAccessError ||
      error instanceof GroupDomainError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("cancelInvitationAction failed", error);
    return {
      status: "error",
      message: "Não foi possível cancelar o convite.",
    };
  }
}

export async function removeMemberAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const user = await requireUser();
  const parsed = groupMemberActionSchema.safeParse({
    groupId: formString(formData, "groupId"),
    userId: formString(formData, "userId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Integrante inválido." };
  }

  try {
    await removeGroupMember(parsed.data.groupId, user.id, parsed.data.userId);
  } catch (error) {
    if (
      error instanceof GroupAccessError ||
      error instanceof GroupDomainError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("removeMemberAction failed", error);
    return {
      status: "error",
      message: "Não foi possível remover o integrante.",
    };
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/${parsed.data.groupId}`);

  return { status: "success", message: "Integrante removido do grupo." };
}

export async function promoteMemberAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const user = await requireUser();
  const parsed = groupMemberActionSchema.safeParse({
    groupId: formString(formData, "groupId"),
    userId: formString(formData, "userId"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Integrante inválido." };
  }

  try {
    await promoteGroupMember(parsed.data.groupId, user.id, parsed.data.userId);
  } catch (error) {
    if (
      error instanceof GroupAccessError ||
      error instanceof GroupDomainError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("promoteMemberAction failed", error);
    return {
      status: "error",
      message: "Não foi possível promover o integrante.",
    };
  }

  revalidatePath(`/groups/${parsed.data.groupId}`);

  return {
    status: "success",
    message: "Integrante promovido a administrador.",
  };
}

export async function leaveGroupAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const user = await requireUser();
  const groupId = groupIdSchema.safeParse(formString(formData, "groupId"));

  if (!groupId.success) {
    return { status: "error", message: "Grupo inválido." };
  }

  try {
    await leaveGroup(groupId.data, user.id);
  } catch (error) {
    if (
      error instanceof GroupAccessError ||
      error instanceof GroupDomainError
    ) {
      return { status: "error", message: readableError(error) };
    }

    console.error("leaveGroupAction failed", error);
    return {
      status: "error",
      message: "Não foi possível sair do grupo.",
    };
  }

  revalidatePath("/groups");
  revalidatePath("/", "layout");
  redirect("/groups");
}

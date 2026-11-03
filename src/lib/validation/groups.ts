import { z } from "zod";
import { emailSchema } from "./email";

export const groupIdSchema = z.uuid("Grupo inválido.");
export const invitationIdSchema = z.uuid("Convite inválido.");
export const userIdSchema = z.uuid("Usuário inválido.");

export const groupNameSchema = z
  .string()
  .trim()
  .min(2, "O nome do grupo deve ter pelo menos 2 caracteres.")
  .max(120, "O nome do grupo deve ter no máximo 120 caracteres.");

export const groupDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "A descrição deve ter no máximo 2.000 caracteres.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

export const groupFormSchema = z.object({
  name: groupNameSchema,
  description: groupDescriptionSchema,
});

export const inviteEmailsSchema = z
  .array(emailSchema)
  .min(1, "Informe pelo menos um e-mail.")
  .max(20, "Envie no máximo 20 convites por vez.")
  .transform((emails) => [...new Set(emails)]);

export const inviteMembersSchema = z.object({
  groupId: groupIdSchema,
  emails: inviteEmailsSchema,
});

export const invitationResponseSchema = z.object({
  invitationId: invitationIdSchema,
  decision: z.enum(["accept", "decline"]),
});

export const groupMemberActionSchema = z.object({
  groupId: groupIdSchema,
  userId: userIdSchema,
});

export const cancelInvitationSchema = z.object({
  groupId: groupIdSchema,
  invitationId: invitationIdSchema,
});

export type GroupFormInput = z.infer<typeof groupFormSchema>;

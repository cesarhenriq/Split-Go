"use server";

import { revalidatePath } from "next/cache";
import { updateUserProfile } from "@/features/settings/server/update-profile";
import type { ProfileFormState } from "@/features/settings/types";
import { requireUser } from "@/lib/auth/current-user";
import { isPostgresUniqueViolation } from "@/lib/db/errors";
import { profileSchema } from "@/lib/validation/auth";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateProfileAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const currentUser = await requireUser();

  const values = {
    name: formString(formData, "name"),
    email: formString(formData, "email"),
  };

  const parsed = profileSchema.safeParse(values);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    await updateUserProfile(currentUser.id, parsed.data);
  } catch (error) {
    if (isPostgresUniqueViolation(error, "users_email_unique")) {
      return {
        status: "error",
        message: "Este e-mail já está em uso por outra conta.",
        fieldErrors: {
          email: ["Este e-mail já está em uso por outra conta."],
        },
        values,
      };
    }

    return {
      status: "error",
      message: "Não foi possível atualizar seu perfil. Tente novamente.",
      values,
    };
  }

  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "Perfil atualizado com sucesso.",
    values,
  };
}

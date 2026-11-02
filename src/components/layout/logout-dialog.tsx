"use client";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { logoutAction } from "@/features/auth/actions";

export type LogoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sair da conta?"
      description="Sua sessão será encerrada no servidor e você precisará entrar novamente."
      confirmLabel="Sair"
      cancelLabel="Cancelar"
      formAction={logoutAction}
    />
  );
}

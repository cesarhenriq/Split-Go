"use client";

import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { routes } from "@/config/routes";

export type LogoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const router = useRouter();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Encerrar sessão de demonstração?"
      description="A autenticação ainda não está implementada. Para continuar explorando o layout, você será direcionado para a tela de login."
      confirmLabel="Ir para o login"
      cancelLabel="Continuar no app"
      onConfirm={() => router.push(routes.auth.login)}
    />
  );
}

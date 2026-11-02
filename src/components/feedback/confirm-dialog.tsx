"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  loading?: boolean;
  onConfirm?: () => void;
  formAction?: (formData: FormData) => void | Promise<void>;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  loading = false,
  onConfirm,
  formAction,
}: ConfirmDialogProps) {
  const confirmButton = (
    <Button
      type={formAction ? "submit" : "button"}
      variant={tone === "danger" ? "danger" : "default"}
      onClick={
        formAction
          ? undefined
          : () => {
              onConfirm?.();
              onOpenChange(false);
            }
      }
      loading={loading}
    >
      {confirmLabel}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          {formAction ? (
            <form action={formAction}>{confirmButton}</form>
          ) : (
            confirmButton
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

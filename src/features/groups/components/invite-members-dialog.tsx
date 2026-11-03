"use client";

import { Plus, UserPlus, X } from "lucide-react";
import { useActionState, useState } from "react";
import { FormAlert } from "@/components/feedback/form-alert";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteMembersAction } from "@/features/groups/actions";
import {
  type InviteResultStatus,
  initialInviteFormState,
} from "@/features/groups/types";
import { emailSchema } from "@/lib/validation/email";

const resultVariants: Record<
  InviteResultStatus,
  "success" | "warning" | "secondary" | "danger"
> = {
  created: "success",
  pending: "warning",
  "already-member": "secondary",
  self: "danger",
  "not-registered": "danger",
  error: "danger",
};

const resultLabels: Record<InviteResultStatus, string> = {
  created: "Criado",
  pending: "Pendente",
  "already-member": "Já é membro",
  self: "Inválido",
  "not-registered": "Não cadastrado",
  error: "Erro",
};

export type InviteMembersDialogProps = {
  groupId: string;
};

export function InviteMembersDialog({ groupId }: InviteMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(
    inviteMembersAction,
    initialInviteFormState,
  );

  function addEmail() {
    const parsed = emailSchema.safeParse(emailInput);

    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "E-mail inválido.");
      return;
    }

    if (emails.includes(parsed.data)) {
      setEmailError("Este e-mail já foi adicionado.");
      return;
    }

    if (emails.length >= 20) {
      setEmailError("Envie no máximo 20 convites por vez.");
      return;
    }

    setEmails((current) => [...current, parsed.data]);
    setEmailInput("");
    setEmailError(null);
  }

  function removeEmail(email: string) {
    setEmails((current) => current.filter((item) => item !== email));
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        Convidar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogClose />
          <DialogHeader>
            <DialogTitle>Convidar integrantes</DialogTitle>
            <DialogDescription>
              Só é possível convidar pessoas que já possuem conta no Split-Go. O
              envio por e-mail ainda não está configurado; os convidados verão o
              convite em “Convites” após entrar com o e-mail correto.
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="space-y-5 p-6">
            <input type="hidden" name="groupId" value={groupId} />
            {emails.map((email) => (
              <input key={email} type="hidden" name="emails" value={email} />
            ))}

            {state.status === "error" && state.message && (
              <FormAlert>{state.message}</FormAlert>
            )}

            {state.results && state.results.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Resultado dos convites</p>
                <ul className="space-y-2">
                  {state.results.map((result) => (
                    <li
                      key={result.email}
                      className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="truncate text-sm">{result.email}</span>
                      <Badge variant={resultVariants[result.status]}>
                        {resultLabels[result.status]}
                      </Badge>
                      <span className="text-meta text-neutral-500 sm:basis-full">
                        {result.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <div className="flex gap-2">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="pessoa@exemplo.com"
                  value={emailInput}
                  onChange={(event) => {
                    setEmailInput(event.target.value);
                    setEmailError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addEmail();
                    }
                  }}
                  aria-invalid={Boolean(emailError)}
                  aria-describedby={
                    emailError ? "invite-email-error" : undefined
                  }
                />
                <Button type="button" variant="outline" onClick={addEmail}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Adicionar
                </Button>
              </div>
              {emailError && (
                <p
                  id="invite-email-error"
                  className="text-meta text-danger-600"
                >
                  {emailError}
                </p>
              )}
            </div>

            {emails.length > 0 && (
              <ul className="space-y-2">
                {emails.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted px-3 py-2"
                  >
                    <span className="truncate text-sm">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover ${email}`}
                      onClick={() => removeEmail(email)}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <DialogFooter className="p-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={pending}
                disabled={emails.length === 0}
              >
                Criar convites
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import { routes } from "@/config/routes";

export function GroupsEmptyState() {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum grupo por aqui"
      description="Crie seu primeiro grupo para organizar as pessoas que compartilham despesas com você."
      action={
        <ButtonLink href={`${routes.dashboard.groups}/new`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Criar grupo
        </ButtonLink>
      }
    />
  );
}

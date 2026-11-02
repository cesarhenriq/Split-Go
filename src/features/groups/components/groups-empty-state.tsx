import { Users } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

export function GroupsEmptyState() {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum grupo por aqui"
      description="Os grupos organizam quem participa de cada divisão de despesas. A criação estará disponível na próxima etapa do projeto."
      action={
        <div className="flex flex-col items-center gap-2">
          <Button type="button" disabled>
            Novo grupo
          </Button>
          <span className="text-meta text-neutral-500">
            Disponível em breve
          </span>
        </div>
      }
    />
  );
}

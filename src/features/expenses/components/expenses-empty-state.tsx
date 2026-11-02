import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import { routes } from "@/config/routes";

export function ExpensesEmptyState() {
  return (
    <EmptyState
      icon={Receipt}
      title="Nenhuma despesa registrada"
      description="As despesas aparecerão aqui quando você criar um grupo e começar a dividir os gastos com os participantes."
      action={
        <ButtonLink href={routes.dashboard.groups} variant="outline">
          Ver meus grupos
        </ButtonLink>
      }
    />
  );
}

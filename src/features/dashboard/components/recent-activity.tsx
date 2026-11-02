import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/config/routes";

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade recente</CardTitle>
        <CardDescription>
          As últimas movimentações dos seus grupos aparecerão aqui.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={Receipt}
          title="Nenhuma atividade recente"
          description="Quando você criar grupos e registrar despesas, o histórico ficará visível nesta área."
          action={
            <ButtonLink
              href={routes.dashboard.groups}
              variant="outline"
              size="sm"
            >
              Ver meus grupos
            </ButtonLink>
          }
          className="border-0 bg-transparent px-4 py-8"
        />
      </CardContent>
    </Card>
  );
}

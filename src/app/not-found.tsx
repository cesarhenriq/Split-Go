import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { ButtonLink } from "@/components/ui/button-link";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <PageContainer className="flex min-h-dvh items-center justify-center py-16">
      <EmptyState
        icon={Inbox}
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido. Volte para a visão geral e continue de onde parou."
        action={
          <ButtonLink href={routes.dashboard.home}>
            Ir para o dashboard
          </ButtonLink>
        }
        className="w-full max-w-xl"
      />
    </PageContainer>
  );
}

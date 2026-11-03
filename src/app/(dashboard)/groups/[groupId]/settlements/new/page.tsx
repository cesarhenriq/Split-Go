import { HandCoins, Receipt } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettlementForm } from "@/features/settlements/components/settlement-form";
import { SettlementFormSkeleton } from "@/features/settlements/components/settlements-skeleton";
import { getSettlementFormContext } from "@/features/settlements/server/queries";
import { requireUser } from "@/lib/auth/current-user";
import { groupIdSchema } from "@/lib/validation/groups";

export const metadata: Metadata = {
  title: "Registrar pagamento",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewSettlementPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { groupId } = await params;
  const parsedGroupId = groupIdSchema.safeParse(groupId);

  if (!parsedGroupId.success) {
    notFound();
  }

  return (
    <Suspense fallback={<SettlementFormSkeleton />}>
      <NewSettlementLoader
        groupId={parsedGroupId.data}
        searchParams={searchParams}
      />
    </Suspense>
  );
}

async function NewSettlementLoader({
  groupId,
  searchParams,
}: {
  groupId: string;
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const context = await getSettlementFormContext(groupId, user.id);

  if (!context) {
    notFound();
  }

  const requestedReceiver = first(params.to);
  const initialReceivedBy =
    requestedReceiver &&
    context.creditors.some((creditor) => creditor.userId === requestedReceiver)
      ? requestedReceiver
      : undefined;

  const requestedAmount = first(params.amount);
  const initialAmount =
    requestedAmount && /^\d+$/.test(requestedAmount)
      ? requestedAmount
      : undefined;

  const hasAvailableBalance = context.currentUserAvailableToPay !== "0";
  const hasCreditors = context.creditors.length > 0;

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Registrar pagamento"
        description={`Informe um pagamento realizado no grupo ${context.groupName}.`}
        action={
          <ButtonLink href={`/groups/${groupId}/dashboard`} variant="outline">
            Painel financeiro
          </ButtonLink>
        }
      />

      {!hasAvailableBalance ? (
        <EmptyState
          icon={Receipt}
          title="Você não possui saldo devedor disponível"
          description="Só é possível registrar um pagamento quando você tem uma dívida confirmada e ainda não reservada por outro pagamento pendente."
          action={
            <ButtonLink href={`/groups/${groupId}/dashboard`}>
              Voltar ao painel financeiro
            </ButtonLink>
          }
        />
      ) : !hasCreditors ? (
        <EmptyState
          icon={HandCoins}
          title="Nenhum credor disponível"
          description="Não há integrantes com saldo credor disponível para receber este pagamento."
          action={
            <ButtonLink href={`/groups/${groupId}/dashboard`}>
              Voltar ao painel financeiro
            </ButtonLink>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dados do pagamento</CardTitle>
            <CardDescription>
              O pagamento começa como pendente e só altera os saldos após a
              confirmação do destinatário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettlementForm
              context={context}
              defaultPaidAt={new Date().toISOString().slice(0, 10)}
              initialReceivedBy={initialReceivedBy}
              initialAmount={initialAmount}
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

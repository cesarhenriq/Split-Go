import { ArrowRight, HandCoins, Inbox } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettlementActions } from "@/features/settlements/components/settlement-actions";
import { SettlementStatusBadge } from "@/features/settlements/components/settlement-status-badge";
import type { SettlementListItem } from "@/features/settlements/types";
import { formatDate } from "@/lib/date";
import { formatCents } from "@/lib/money";

export function PendingSettlementsList({
  groupId,
  settlements,
  currentUserId,
}: {
  groupId: string;
  settlements: SettlementListItem[];
  currentUserId: string;
}) {
  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600">
          <Inbox className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="text-section-title">Nenhum pagamento pendente</h3>
        <p className="mt-2 max-w-md text-body text-neutral-500">
          Não há pagamentos aguardando confirmação neste grupo. Novos pagamentos
          registrados aparecerão aqui.
        </p>
        <ButtonLink
          href={`/groups/${groupId}/settlements/new`}
          className="mt-6"
        >
          <HandCoins className="h-4 w-4" aria-hidden="true" />
          Registrar pagamento
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {settlements.map((settlement) => {
        const isReceiver = settlement.receivedById === currentUserId;

        return (
          <Card key={settlement.id}>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  <span>{settlement.paidByName}</span>
                  <ArrowRight
                    className="h-4 w-4 text-neutral-400"
                    aria-hidden="true"
                  />
                  <span>{settlement.receivedByName}</span>
                </CardTitle>
                <SettlementStatusBadge status={settlement.status} />
              </div>
              <CardDescription>
                Registrado em {formatDate(settlement.createdAt)} · Data do
                pagamento {formatDate(settlement.paidAt)}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-2xl font-bold">
                {formatCents(settlement.amount)}
              </p>

              {isReceiver && (
                <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-body text-warning-800">
                  <p className="font-medium">Pagamento recebido</p>
                  <p className="mt-1">
                    {settlement.paidByName} informou um pagamento de{" "}
                    {formatCents(settlement.amount)}. Você confirma que recebeu
                    esse valor?
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <ButtonLink
                  href={`/groups/${groupId}/settlements/${settlement.id}`}
                  variant="outline"
                  size="sm"
                >
                  Ver detalhes
                </ButtonLink>

                <SettlementActions
                  groupId={groupId}
                  settlementId={settlement.id}
                  canConfirm={settlement.canConfirm}
                  canCancel={settlement.canCancel}
                  payerName={settlement.paidByName}
                  amountLabel={formatCents(settlement.amount)}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

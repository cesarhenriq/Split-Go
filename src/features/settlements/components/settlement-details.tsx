import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  User,
  XCircle,
} from "lucide-react";
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
import { SettlementActions } from "@/features/settlements/components/settlement-actions";
import { SettlementStatusBadge } from "@/features/settlements/components/settlement-status-badge";
import type { SettlementDetail } from "@/features/settlements/types";
import { formatDate, formatDateTime } from "@/lib/date";
import { formatCents } from "@/lib/money";

export function SettlementDetails({
  settlement,
}: {
  settlement: SettlementDetail;
}) {
  const pending = settlement.status === "PENDING";
  const confirmed = settlement.status === "CONFIRMED";
  const cancelled = settlement.status === "CANCELLED";

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Detalhes do pagamento"
        description={`${settlement.paidByName} pagou para ${settlement.receivedByName}.`}
        action={
          <div className="flex flex-wrap items-start justify-end gap-2">
            <ButtonLink
              href={`/groups/${settlement.groupId}/settlements`}
              variant="outline"
            >
              Histórico
            </ButtonLink>
            <ButtonLink
              href={`/groups/${settlement.groupId}/dashboard`}
              variant="outline"
            >
              Painel financeiro
            </ButtonLink>
          </div>
        }
      />

      {pending && (
        <div
          aria-live="polite"
          className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-body text-warning-800"
        >
          Este pagamento foi apenas registrado e ainda não foi confirmado. Ele
          não altera os saldos enquanto estiver pendente.
        </div>
      )}

      {confirmed && (
        <div
          aria-live="polite"
          className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-body text-success-800"
        >
          Pagamento confirmado. Este registro é definitivo nesta etapa e não
          pode ser editado ou cancelado. Para corrigir o valor, será necessário
          implementar um fluxo de estorno em etapa futura.
        </div>
      )}

      {cancelled && (
        <div
          aria-live="polite"
          className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-body text-danger-800"
        >
          Este pagamento foi cancelado
          {settlement.cancelledByName
            ? ` por ${settlement.cancelledByName}`
            : ""}
          . O histórico foi preservado e os saldos não foram alterados.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-meta text-neutral-500">Valor</p>
            <p className="mt-1 text-xl font-bold">
              {formatCents(settlement.amount)}
            </p>
            <div className="mt-3">
              <SettlementStatusBadge status={settlement.status} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <User className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <div>
              <p className="text-meta text-neutral-500">Pagador</p>
              <p className="text-sm font-medium">{settlement.paidByName}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <User className="h-5 w-5 text-success-600" aria-hidden="true" />
            <div>
              <p className="text-meta text-neutral-500">Destinatário</p>
              <p className="text-sm font-medium">{settlement.receivedByName}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <CalendarDays
              className="h-5 w-5 text-primary-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-meta text-neutral-500">Data do pagamento</p>
              <p className="text-sm font-medium">
                {formatDate(settlement.paidAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo do pagamento</CardTitle>
          <CardDescription>
            Datas registradas pelo servidor para preservar a auditoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <Clock3
                className="mt-0.5 h-5 w-5 shrink-0 text-primary-600"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">Registrado em</p>
                <p className="text-meta text-neutral-500">
                  {formatDateTime(settlement.createdAt)}
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <ArrowRight
                className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium">Status atual</p>
                <p className="text-meta text-neutral-500">
                  {pending
                    ? "Aguardando confirmação do destinatário."
                    : confirmed
                      ? "Confirmado pelo destinatário."
                      : "Cancelado antes da confirmação."}
                </p>
              </div>
            </li>

            {settlement.confirmedAt && (
              <li className="flex gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-success-600"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">Confirmado em</p>
                  <p className="text-meta text-neutral-500">
                    {formatDateTime(settlement.confirmedAt)}
                  </p>
                </div>
              </li>
            )}

            {settlement.cancelledAt && (
              <li className="flex gap-3">
                <XCircle
                  className="mt-0.5 h-5 w-5 shrink-0 text-danger-600"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">Cancelado em</p>
                  <p className="text-meta text-neutral-500">
                    {formatDateTime(settlement.cancelledAt)}
                    {settlement.cancelledByName
                      ? ` por ${settlement.cancelledByName}`
                      : ""}
                  </p>
                </div>
              </li>
            )}
          </ol>

          {pending && (
            <div className="mt-6 border-t border-border pt-6">
              <SettlementActions
                groupId={settlement.groupId}
                settlementId={settlement.id}
                canConfirm={settlement.canConfirm}
                canCancel={settlement.canCancel}
                payerName={settlement.paidByName}
                amountLabel={formatCents(settlement.amount)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

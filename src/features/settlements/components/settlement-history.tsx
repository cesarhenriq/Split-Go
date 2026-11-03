import { ArrowRight, Clock3, FileText } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettlementStatusBadge } from "@/features/settlements/components/settlement-status-badge";
import type {
  SettlementListItem,
  SettlementStatus,
} from "@/features/settlements/types";
import { formatDate } from "@/lib/date";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

const filterOptions: Array<{
  value: "all" | SettlementStatus;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "PENDING", label: "Pendentes" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "CANCELLED", label: "Cancelados" },
];

function filterHref(groupId: string, status: "all" | SettlementStatus) {
  const base = `/groups/${groupId}/settlements`;
  return status === "all" ? base : `${base}?status=${status}`;
}

export function SettlementHistory({
  groupId,
  settlements,
  status,
}: {
  groupId: string;
  settlements: SettlementListItem[];
  status: "all" | SettlementStatus;
}) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div>
          <CardTitle>Histórico de pagamentos</CardTitle>
          <CardDescription>
            Pagamentos registrados entre integrantes do grupo. Somente
            pagamentos confirmados alteram os saldos.
          </CardDescription>
        </div>

        <nav aria-label="Filtrar pagamentos" className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <ButtonLink
              key={option.value}
              href={filterHref(groupId, option.value)}
              variant={status === option.value ? "default" : "outline"}
              size="sm"
              aria-current={status === option.value ? "page" : undefined}
            >
              {option.label}
            </ButtonLink>
          ))}
        </nav>
      </CardHeader>

      <CardContent>
        {settlements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <FileText
              className="mx-auto h-8 w-8 text-neutral-400"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium">
              Nenhum pagamento encontrado
            </p>
            <p className="mt-1 text-meta text-neutral-500">
              Ajuste o filtro ou registre um novo pagamento.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {settlements.map((settlement) => (
              <li
                key={settlement.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{settlement.paidByName}</span>
                    <ArrowRight
                      className="h-4 w-4 text-neutral-400"
                      aria-hidden="true"
                    />
                    <span className="font-medium">
                      {settlement.receivedByName}
                    </span>
                    <SettlementStatusBadge status={settlement.status} />
                  </div>

                  <p className="text-meta text-neutral-500">
                    Registrado em {formatDate(settlement.createdAt)} · Data do
                    pagamento {formatDate(settlement.paidAt)}
                    {settlement.confirmedAt
                      ? ` · Confirmado em ${formatDate(settlement.confirmedAt)}`
                      : ""}
                    {settlement.cancelledAt
                      ? ` · Cancelado em ${formatDate(settlement.cancelledAt)}`
                      : ""}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 lg:justify-end">
                  <span
                    className={cn(
                      "text-lg font-semibold",
                      settlement.status === "CONFIRMED"
                        ? "text-success-700"
                        : settlement.status === "CANCELLED"
                          ? "text-neutral-400 line-through"
                          : "text-foreground",
                    )}
                  >
                    {formatCents(settlement.amount)}
                  </span>

                  <ButtonLink
                    href={`/groups/${groupId}/settlements/${settlement.id}`}
                    variant="outline"
                    size="sm"
                  >
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                    Detalhes
                  </ButtonLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

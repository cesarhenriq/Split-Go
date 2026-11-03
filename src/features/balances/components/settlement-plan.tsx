import { ArrowRight } from "lucide-react";
import { SuccessFeedback } from "@/components/feedback/success-feedback";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SettlementSuggestion } from "@/lib/finance/finance-types";
import { formatCents } from "@/lib/money";

export function SettlementPlan({
  suggestions,
  totalSuggested,
  groupId,
  currentUserId,
  activeUserIds,
}: {
  suggestions: SettlementSuggestion[];
  totalSuggested: bigint;
  groupId?: string;
  currentUserId?: string;
  activeUserIds?: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plano sugerido de pagamentos</CardTitle>
        <CardDescription>
          Transferências calculadas para zerar os saldos do grupo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.length === 0 ? (
          <SuccessFeedback
            title="Grupo equilibrado"
            description="Não há transferências pendentes com base nas despesas registradas."
          />
        ) : (
          <ul className="space-y-2">
            {suggestions.map((suggestion) => (
              <li
                key={`${suggestion.fromUserId}-${suggestion.toUserId}-${suggestion.amount}`}
                className="flex flex-col gap-1 rounded-lg border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-medium">{suggestion.fromName}</span>
                  <ArrowRight
                    className="h-4 w-4 text-neutral-400"
                    aria-hidden="true"
                  />
                  <span className="font-medium">{suggestion.toName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-primary-700">
                    {formatCents(suggestion.amount)}
                  </span>
                  {groupId &&
                    currentUserId === suggestion.fromUserId &&
                    (!activeUserIds ||
                      activeUserIds.includes(suggestion.toUserId)) && (
                      <ButtonLink
                        href={`/groups/${groupId}/settlements/new?to=${suggestion.toUserId}&amount=${suggestion.amount}`}
                        size="sm"
                        variant="outline"
                      >
                        Registrar pagamento
                      </ButtonLink>
                    )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {suggestions.length > 0 && (
          <p className="text-sm text-neutral-600">
            Total de {suggestions.length}{" "}
            {suggestions.length === 1 ? "transferência" : "transferências"} ·{" "}
            {formatCents(totalSuggested)}
          </p>
        )}

        <p className="rounded-lg bg-surface-muted px-3 py-2 text-meta text-neutral-500">
          Estas são sugestões calculadas com base nas despesas registradas.
          Nenhum pagamento foi confirmado.
        </p>
      </CardContent>
    </Card>
  );
}

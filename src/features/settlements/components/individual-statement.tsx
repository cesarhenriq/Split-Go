import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Scale,
  Send,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettlementStatusBadge } from "@/features/settlements/components/settlement-status-badge";
import type {
  StatementSettlementRow,
  StatementView,
} from "@/features/settlements/types";
import { formatDate } from "@/lib/date";
import { formatCents } from "@/lib/money";
import type { StatementFilters } from "@/lib/validation/settlements";

function formatBalance(value: bigint) {
  return value > 0n ? `+${formatCents(value)}` : formatCents(value);
}

function StatementPaymentsTable({
  rows,
  emptyMessage,
}: {
  rows: StatementSettlementRow[];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-meta text-neutral-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-left text-meta text-neutral-500">
          <tr>
            <th className="px-3 py-2 font-medium">Pessoa</th>
            <th className="px-3 py-2 text-right font-medium">Valor</th>
            <th className="px-3 py-2 font-medium">Data</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Confirmação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.settlementId}>
              <td className="px-3 py-3 font-medium">{row.counterpartName}</td>
              <td className="px-3 py-3 text-right font-semibold">
                {formatCents(row.amount)}
              </td>
              <td className="px-3 py-3 text-neutral-500">
                {formatDate(row.paidAt)}
              </td>
              <td className="px-3 py-3">
                <SettlementStatusBadge status={row.status} />
              </td>
              <td className="px-3 py-3 text-neutral-500">
                {row.confirmedAt ? formatDate(row.confirmedAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IndividualStatement({
  groupId,
  view,
  filters,
}: {
  groupId: string;
  view: StatementView;
  filters: StatementFilters;
}) {
  const sentPayments = view.settlements.filter(
    (settlement) => settlement.direction === "sent",
  );
  const receivedPayments = view.settlements.filter(
    (settlement) => settlement.direction === "received",
  );
  const showExpenses = filters.type === "all" || filters.type === "expenses";
  const showSent = filters.type === "all" || filters.type === "sent";
  const showReceived = filters.type === "all" || filters.type === "received";
  const pendingTotal = view.summary.pendingSent + view.summary.pendingReceived;

  return (
    <div className="space-y-6">
      <section aria-labelledby="resumo-extrato" className="space-y-3">
        <h2 id="resumo-extrato" className="text-section-title">
          Resumo do extrato
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Receipt
                className="h-5 w-5 text-primary-600"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-meta text-neutral-500">
                  Total pago em despesas
                </p>
                <p className="text-lg font-bold">
                  {formatCents(view.summary.totalPaid)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Wallet className="h-5 w-5 text-neutral-600" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-meta text-neutral-500">
                  Total devido em despesas
                </p>
                <p className="text-lg font-bold">
                  {formatCents(view.summary.totalOwed)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <ArrowUpRight
                className="h-5 w-5 text-success-600"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-meta text-neutral-500">Enviado confirmado</p>
                <p className="text-lg font-bold text-success-700">
                  {formatCents(view.summary.totalSent)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <ArrowDownLeft
                className="h-5 w-5 text-primary-600"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-meta text-neutral-500">
                  Recebido confirmado
                </p>
                <p className="text-lg font-bold">
                  {formatCents(view.summary.totalReceived)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Scale className="h-5 w-5 text-primary-600" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-meta text-neutral-500">Saldo atual</p>
                <p
                  className={
                    view.summary.balance > 0n
                      ? "text-lg font-bold text-success-700"
                      : view.summary.balance < 0n
                        ? "text-lg font-bold text-danger-700"
                        : "text-lg font-bold text-neutral-500"
                  }
                >
                  {formatBalance(view.summary.balance)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-5">
              <Send className="h-5 w-5 text-warning-600" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-meta text-neutral-500">
                  Total de pagamentos pendentes
                </p>
                <p className="text-lg font-bold text-warning-700">
                  {formatCents(pendingTotal)}
                </p>
                <p className="text-meta text-neutral-500">
                  Enviados {formatCents(view.summary.pendingSent)} · recebidos{" "}
                  {formatCents(view.summary.pendingReceived)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="rounded-lg bg-surface-muted px-3 py-2 text-meta text-neutral-500">
          O saldo atual considera somente pagamentos confirmados. Valores
          pendentes aparecem separados e não alteram o saldo.
        </p>
      </section>

      {showExpenses && (
        <Card>
          <CardHeader>
            <CardTitle>Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {view.expenses.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-meta text-neutral-500">
                Nenhuma despesa encontrada no período selecionado.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-muted text-left text-meta text-neutral-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Descrição</th>
                      <th className="px-3 py-2 font-medium">Data</th>
                      <th className="px-3 py-2 text-right font-medium">
                        Valor total
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        Valor assumido
                      </th>
                      <th className="px-3 py-2 font-medium">Pago por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {view.expenses.map((expense) => (
                      <tr key={expense.expenseId}>
                        <td className="px-3 py-3 font-medium">
                          {expense.description}
                          {expense.userIsPayer && (
                            <span className="ml-2 text-meta text-primary-600">
                              (você pagou)
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-neutral-500">
                          {formatDate(expense.expenseDate)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatCents(expense.totalAmount)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">
                          {formatCents(expense.userShare)}
                        </td>
                        <td className="px-3 py-3 text-neutral-500">
                          {expense.paidByName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showSent && (
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <StatementPaymentsTable
              rows={sentPayments}
              emptyMessage="Nenhum pagamento enviado para os filtros selecionados."
            />
          </CardContent>
        </Card>
      )}

      {showReceived && (
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <StatementPaymentsTable
              rows={receivedPayments}
              emptyMessage="Nenhum pagamento recebido para os filtros selecionados."
            />
          </CardContent>
        </Card>
      )}

      <p className="text-meta text-neutral-500">
        Extrato do grupo {view.groupName} para {view.memberName}.{" "}
        {groupId ? "Somente você pode acessar este extrato." : ""}
      </p>
    </div>
  );
}

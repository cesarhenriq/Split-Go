import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FinancialStatusBadge } from "@/features/settlements/components/financial-status-badge";
import type { FinancialDashboardView } from "@/features/settlements/types";
import { formatCents } from "@/lib/money";

export function FinancialSummary({ view }: { view: FinancialDashboardView }) {
  const registeredCount =
    view.confirmedCount + view.pendingCount + view.cancelledCount;

  return (
    <section aria-labelledby="resumo-financeiro" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="resumo-financeiro" className="text-section-title">
          Resumo financeiro
        </h2>
        <FinancialStatusBadge status={view.financialStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body text-neutral-500">Despesas válidas</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                <Receipt className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {formatCents(view.balances.totalExpenses)}
            </p>
            <p className="mt-1 text-meta text-neutral-500">
              {view.balances.members.length}{" "}
              {view.balances.members.length === 1
                ? "integrante"
                : "integrantes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body text-neutral-500">
                Pagamentos registrados
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Wallet className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {formatCents(view.totalRegistered)}
            </p>
            <p className="mt-1 text-meta text-neutral-500">
              {registeredCount}{" "}
              {registeredCount === 1 ? "registro" : "registros"} ·{" "}
              {view.cancelledCount}{" "}
              {view.cancelledCount === 1 ? "cancelado" : "cancelados"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body text-neutral-500">Confirmados</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-success-700">
              {formatCents(view.totalConfirmed)}
            </p>
            <p className="mt-1 text-meta text-neutral-500">
              {view.confirmedCount}{" "}
              {view.confirmedCount === 1 ? "pagamento" : "pagamentos"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body text-neutral-500">Pendentes</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-warning-700">
              {formatCents(view.totalPending)}
            </p>
            <p className="mt-1 text-meta text-neutral-500">
              {view.pendingCount} aguardando confirmação
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <div>
              <p className="text-meta text-neutral-500">Integrantes</p>
              <p className="text-sm font-medium">
                {view.balances.members.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ArrowUpRight
              className="h-5 w-5 text-success-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-meta text-neutral-500">Credores</p>
              <p className="text-sm font-medium">
                {view.balances.creditorsCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ArrowDownRight
              className="h-5 w-5 text-danger-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-meta text-neutral-500">Devedores</p>
              <p className="text-sm font-medium">
                {view.balances.debtorsCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="rounded-lg bg-surface-muted px-3 py-2 text-meta text-neutral-500">
        Pagamentos pendentes não alteram os saldos confirmados. Somente
        pagamentos confirmados pelo destinatário são considerados quitados.
      </p>
    </section>
  );
}

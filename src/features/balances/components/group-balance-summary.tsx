import { ArrowDownRight, ArrowUpRight, Receipt, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { GroupBalancesView } from "@/features/balances/types";
import { formatCents } from "@/lib/money";

export function GroupBalanceSummary({ view }: { view: GroupBalancesView }) {
  return (
    <section aria-labelledby="resumo-saldos" className="space-y-3">
      <h2 id="resumo-saldos" className="text-section-title">
        Resumo financeiro
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body text-neutral-500">Total de despesas</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                <Receipt className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">
              {formatCents(view.totalExpenses)}
            </p>
            <p className="mt-1 text-meta text-neutral-500">
              {view.members.length}{" "}
              {view.members.length === 1 ? "integrante" : "integrantes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body text-neutral-500">A receber</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600">
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-success-700">
              {formatCents(view.totalToReceive)}
            </p>
            <p className="mt-1 text-meta text-neutral-500">
              {view.creditorsCount}{" "}
              {view.creditorsCount === 1 ? "credor" : "credores"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body text-neutral-500">A pagar</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-50 text-danger-600">
                <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-danger-700">
              {formatCents(view.totalToPay)}
            </p>
            <p className="mt-1 text-meta text-neutral-500">
              {view.debtorsCount}{" "}
              {view.debtorsCount === 1 ? "devedor" : "devedores"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-body text-neutral-500">
                Transferências sugeridas
              </p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Scale className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">{view.suggestions.length}</p>
            <p className="mt-1 text-meta text-neutral-500">
              Total de {formatCents(view.totalSuggested)}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="flex flex-wrap gap-x-6 gap-y-1 text-meta text-neutral-500">
        <span>Total pago: {formatCents(view.totalPaid)}</span>
        <span>Total devido: {formatCents(view.totalOwed)}</span>
        <span>Enviado confirmado: {formatCents(view.totalSent)}</span>
        <span>Recebido confirmado: {formatCents(view.totalReceived)}</span>
      </p>
    </section>
  );
}

import { CalendarDays, Pencil, Receipt, User, Users } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExpenseCancelButton } from "@/features/expenses/components/expense-cancel-button";
import type { ExpenseDetail } from "@/features/expenses/types";
import { formatDate } from "@/lib/date";
import { formatCents, formatPercentage } from "@/lib/money";

const methodLabels = {
  EQUAL: "Igualitário",
  PERCENTAGE: "Porcentagem",
  FIXED: "Valores fixos",
} as const;

export function ExpenseDetails({ expense }: { expense: ExpenseDetail }) {
  const cancelled = expense.cancelledAt !== null;
  const difference = BigInt(expense.difference);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title={expense.description}
        description={`${expense.groupName} · ${formatDate(expense.expenseDate)}`}
        action={
          !cancelled && (expense.canEdit || expense.canCancel) ? (
            <div className="flex flex-wrap items-start justify-end gap-2">
              {expense.canEdit && (
                <ButtonLink
                  href={`/groups/${expense.groupId}/expenses/${expense.id}/edit`}
                  variant="outline"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar
                </ButtonLink>
              )}
              {expense.canCancel && (
                <ExpenseCancelButton
                  groupId={expense.groupId}
                  expenseId={expense.id}
                />
              )}
            </div>
          ) : undefined
        }
      />

      {cancelled && (
        <div
          aria-live="polite"
          className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-body text-danger-800"
        >
          Esta despesa foi cancelada
          {expense.cancelledByName ? ` por ${expense.cancelledByName}` : ""}. O
          histórico e os rateios foram preservados.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-meta text-neutral-500">Valor total</p>
            <p className="mt-1 text-xl font-bold">
              {formatCents(expense.totalAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <CalendarDays
              className="h-5 w-5 text-primary-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-meta text-neutral-500">Data</p>
              <p className="text-sm font-medium">
                {formatDate(expense.expenseDate)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <User className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <div>
              <p className="text-meta text-neutral-500">Pago por</p>
              <p className="text-sm font-medium">{expense.paidByName}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Receipt className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <div>
              <p className="text-meta text-neutral-500">Método</p>
              <p className="text-sm font-medium">
                {methodLabels[expense.splitMethod]}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Rateio
          </CardTitle>
          <CardDescription>
            Criada por {expense.createdByName}. Soma das parcelas deve ser
            exatamente igual ao total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-muted text-left text-meta text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Participante</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Percentual
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Valor assumido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expense.splits.map((split) => (
                  <tr key={split.userId}>
                    <td className="px-3 py-2">
                      <span className="block font-medium">{split.name}</span>
                      <span className="block text-meta text-neutral-500">
                        {split.email}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-neutral-500">
                      {split.percentage === null
                        ? "—"
                        : formatPercentage(split.percentage)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatCents(split.shareAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border bg-surface-muted">
                <tr>
                  <td className="px-3 py-2 font-medium" colSpan={2}>
                    Total rateado
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCents(expense.totalRated)}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-neutral-500" colSpan={2}>
                    Diferença
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Badge variant={difference === 0n ? "success" : "danger"}>
                      {formatCents(expense.difference)}
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

import { CalendarDays, Receipt, User } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpenseSummary } from "@/features/expenses/types";
import { formatDate } from "@/lib/date";
import { formatCents } from "@/lib/money";

const methodLabels = {
  EQUAL: "Igualitário",
  PERCENTAGE: "Porcentagem",
  FIXED: "Valores fixos",
} as const;

export function ExpenseCard({ expense }: { expense: ExpenseSummary }) {
  const cancelled = expense.cancelledAt !== null;

  return (
    <Card className={cancelled ? "opacity-75" : undefined}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <CardTitle className="truncate">
            <Link
              href={`/groups/${expense.groupId}/expenses/${expense.id}`}
              className="hover:text-primary-700"
            >
              {expense.description}
            </Link>
          </CardTitle>
          <p className="mt-1 text-body text-neutral-500">
            {formatDate(expense.expenseDate)} · {expense.paidByName} pagou
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-lg font-bold">
            {formatCents(expense.totalAmount)}
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            <Badge variant="secondary">
              {methodLabels[expense.splitMethod]}
            </Badge>
            {cancelled && <Badge variant="danger">Cancelada</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 text-meta text-neutral-500">
        <span className="inline-flex items-center gap-1">
          <Receipt className="h-4 w-4" aria-hidden="true" />
          {expense.participantCount}{" "}
          {expense.participantCount === 1 ? "participante" : "participantes"}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {formatDate(expense.createdAt)}
        </span>
        {expense.createdById !== expense.paidById && (
          <span className="inline-flex items-center gap-1">
            <User className="h-4 w-4" aria-hidden="true" />
            Criada por {expense.createdByName}
          </span>
        )}
        <Link
          href={`/groups/${expense.groupId}/expenses/${expense.id}`}
          className="ml-auto font-medium text-primary-600 hover:text-primary-700"
        >
          Ver detalhes
        </Link>
      </CardContent>
    </Card>
  );
}

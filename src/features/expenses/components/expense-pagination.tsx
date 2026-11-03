import { ButtonLink } from "@/components/ui/button-link";
import type { ExpenseFilters } from "@/lib/validation/expenses";

export type ExpensePaginationProps = {
  groupId: string;
  filters: ExpenseFilters;
  page: number;
  totalPages: number;
};

function buildHref(groupId: string, filters: ExpenseFilters, page: number) {
  const params = new URLSearchParams();

  if (filters.description) params.set("description", filters.description);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.paidBy) params.set("paidBy", filters.paidBy);
  if (filters.includeCancelled) params.set("includeCancelled", "on");
  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return `/groups/${groupId}/expenses${query ? `?${query}` : ""}`;
}

export function ExpensePagination({
  groupId,
  filters,
  page,
  totalPages,
}: ExpensePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginação de despesas"
      className="flex items-center justify-between gap-3"
    >
      <ButtonLink
        href={buildHref(groupId, filters, Math.max(1, page - 1))}
        variant="outline"
        size="sm"
        aria-disabled={page <= 1}
        className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
      >
        Anterior
      </ButtonLink>
      <span className="text-meta text-neutral-500">
        Página {page} de {totalPages}
      </span>
      <ButtonLink
        href={buildHref(groupId, filters, Math.min(totalPages, page + 1))}
        variant="outline"
        size="sm"
        aria-disabled={page >= totalPages}
        className={
          page >= totalPages ? "pointer-events-none opacity-50" : undefined
        }
      >
        Próxima
      </ButtonLink>
    </nav>
  );
}

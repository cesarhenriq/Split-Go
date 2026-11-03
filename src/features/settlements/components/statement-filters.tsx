import { Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { StatementFilters as StatementFiltersValue } from "@/lib/validation/settlements";

export function StatementFilters({
  groupId,
  filters,
}: {
  groupId: string;
  filters: StatementFiltersValue;
}) {
  return (
    <form
      action={`/groups/${groupId}/statement`}
      method="get"
      className="rounded-xl border border-border bg-surface p-4 shadow-card"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="statement-from">De</Label>
          <Input
            id="statement-from"
            name="from"
            type="date"
            defaultValue={filters.from}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="statement-to">Até</Label>
          <Input
            id="statement-to"
            name="to"
            type="date"
            defaultValue={filters.to}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="statement-type">Tipo</Label>
          <Select id="statement-type" name="type" defaultValue={filters.type}>
            <option value="all">Todas as movimentações</option>
            <option value="expenses">Despesas</option>
            <option value="sent">Pagamentos enviados</option>
            <option value="received">Pagamentos recebidos</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="statement-status">Status do pagamento</Label>
          <Select
            id="statement-status"
            name="status"
            defaultValue={filters.status}
          >
            <option value="all">Todos</option>
            <option value="PENDING">Pendentes</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="CANCELLED">Cancelados</option>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink href={`/groups/${groupId}/statement`} variant="outline">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Limpar filtros
        </ButtonLink>
        <Button type="submit">
          <Filter className="h-4 w-4" aria-hidden="true" />
          Aplicar filtros
        </Button>
      </div>
    </form>
  );
}

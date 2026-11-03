import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ExpenseMember } from "@/features/expenses/types";
import type { ExpenseFilters } from "@/lib/validation/expenses";

export type ExpenseFiltersFormProps = {
  groupId: string;
  members: ExpenseMember[];
  filters: ExpenseFilters;
};

export function ExpenseFiltersForm({
  groupId,
  members,
  filters,
}: ExpenseFiltersFormProps) {
  return (
    <form
      method="get"
      action={`/groups/${groupId}/expenses`}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 shadow-card md:grid-cols-2 xl:grid-cols-6"
    >
      <div className="space-y-1 xl:col-span-2">
        <Label htmlFor="filter-description">Descrição</Label>
        <Input
          id="filter-description"
          name="description"
          defaultValue={filters.description}
          placeholder="Buscar por descrição"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-from">De</Label>
        <Input
          id="filter-from"
          name="from"
          type="date"
          defaultValue={filters.from}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-to">Até</Label>
        <Input id="filter-to" name="to" type="date" defaultValue={filters.to} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="filter-payer">Pagador</Label>
        <Select id="filter-payer" name="paidBy" defaultValue={filters.paidBy}>
          <option value="">Todos</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col justify-end gap-2">
        <label className="flex items-center gap-2 text-body text-neutral-600">
          <input
            type="checkbox"
            name="includeCancelled"
            defaultChecked={filters.includeCancelled}
            className="h-4 w-4 rounded border-border accent-primary-600"
          />
          Incluir canceladas
        </label>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1">
            <Search className="h-4 w-4" aria-hidden="true" />
            Filtrar
          </Button>
          <ButtonLink
            href={`/groups/${groupId}/expenses`}
            variant="outline"
            size="sm"
          >
            Limpar
          </ButtonLink>
        </div>
      </div>
    </form>
  );
}

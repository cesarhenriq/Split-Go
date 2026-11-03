import { ExpenseCard } from "@/features/expenses/components/expense-card";
import type { ExpenseSummary } from "@/features/expenses/types";

export function ExpenseList({ expenses }: { expenses: ExpenseSummary[] }) {
  return (
    <div className="grid gap-4">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} />
      ))}
    </div>
  );
}

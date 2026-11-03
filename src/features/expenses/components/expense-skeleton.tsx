import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export function ExpenseListSkeleton() {
  return (
    <PageContainer className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando despesas...</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4">
        {["expense-1", "expense-2", "expense-3"].map((item) => (
          <Skeleton key={item} className="h-36 w-full" />
        ))}
      </div>
    </PageContainer>
  );
}

export function ExpenseDetailSkeleton() {
  return (
    <PageContainer className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando detalhes da despesa...</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["total", "date", "payer", "method"].map((item) => (
          <Skeleton key={item} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </PageContainer>
  );
}

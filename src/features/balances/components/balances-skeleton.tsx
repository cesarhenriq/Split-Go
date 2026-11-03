import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export function BalancesSkeleton() {
  return (
    <PageContainer className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando saldos do grupo...</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["expenses", "receive", "pay", "transfers"].map((item) => (
          <Skeleton key={item} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </PageContainer>
  );
}

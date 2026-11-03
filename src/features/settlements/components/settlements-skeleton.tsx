import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

export function FinancialDashboardSkeleton() {
  return (
    <PageContainer className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando painel financeiro...</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["expenses", "registered", "confirmed", "pending"].map((item) => (
          <Skeleton key={item} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </PageContainer>
  );
}

export function SettlementsListSkeleton() {
  return (
    <PageContainer className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando pagamentos...</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </PageContainer>
  );
}

export function SettlementDetailSkeleton() {
  return (
    <PageContainer className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando detalhes do pagamento...</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {["amount", "payer", "receiver", "date"].map((item) => (
          <Skeleton key={item} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-56 w-full" />
    </PageContainer>
  );
}

export function SettlementFormSkeleton() {
  return (
    <PageContainer className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando formulário de pagamento...</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </PageContainer>
  );
}

export function StatementSkeleton() {
  return (
    <PageContainer className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando extrato...</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {["paid", "owed", "sent", "received", "balance", "pending"].map(
          (item) => (
            <Skeleton key={item} className="h-24 w-full" />
          ),
        )}
      </div>
      <Skeleton className="h-64 w-full" />
    </PageContainer>
  );
}

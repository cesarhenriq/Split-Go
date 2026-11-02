import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";

const cards = ["receivable", "payable", "balance", "groups"];
const rows = ["header", "content"];

export function PageSkeleton() {
  return (
    <PageContainer className="space-y-6" aria-busy="true">
      <div aria-live="polite">
        <span className="sr-only">Carregando conteúdo da página</span>
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card}
            className="rounded-xl border border-border bg-surface p-6 shadow-card"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <Skeleton className="h-5 w-40" />
        <div className="mt-5 space-y-4">
          {rows.map((row) => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

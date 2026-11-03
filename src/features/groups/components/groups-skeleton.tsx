import { Skeleton } from "@/components/ui/skeleton";

export function GroupsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
      <span className="sr-only">Carregando grupos...</span>
      {["group-1", "group-2", "group-3"].map((item) => (
        <div
          key={item}
          className="rounded-xl border border-border bg-surface p-6 shadow-card"
        >
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="mt-6 h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

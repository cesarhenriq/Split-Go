import { Skeleton } from "@/components/ui/skeleton";

export function DashboardShellSkeleton() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center gap-3 px-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-3 px-3 py-4">
          {["dashboard", "groups", "expenses", "settlements", "settings"].map(
            (item) => (
              <Skeleton key={item} className="h-10 w-full" />
            ),
          )}
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-6 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-app space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {["a", "b", "c", "d"].map((item) => (
              <Skeleton key={item} className="h-36 w-full" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

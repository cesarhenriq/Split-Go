import { Skeleton } from "@/components/ui/skeleton";

export function InvitationsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Carregando convites...</span>
      {["invite-1", "invite-2"].map((item) => (
        <div
          key={item}
          className="rounded-xl border border-border bg-surface p-6 shadow-card"
        >
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64 max-w-full" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="mt-5 h-9 w-40" />
        </div>
      ))}
    </div>
  );
}

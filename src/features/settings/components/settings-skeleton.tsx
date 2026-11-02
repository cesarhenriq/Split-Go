import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Carregando configurações do perfil...</span>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="mt-6 h-10 w-40" />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        <Skeleton className="mt-6 h-16 w-full" />
        <Skeleton className="mt-3 h-16 w-full" />
      </div>
    </div>
  );
}

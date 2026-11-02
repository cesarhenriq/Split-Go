import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({
  label = "Carregando conteúdo...",
  className,
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-3 text-neutral-500",
        className,
      )}
    >
      <Loader2
        className="h-6 w-6 animate-spin text-primary-600"
        aria-hidden="true"
      />
      <p className="text-body">{label}</p>
    </div>
  );
}

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ErrorStateProps = {
  title?: string;
  description?: string;
  errorId?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Não foi possível concluir a operação",
  description = "Ocorreu um erro inesperado. Tente novamente.",
  errorId,
  retryLabel = "Tentar novamente",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-xl border border-danger-200 bg-danger-50 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-danger-700">
        <TriangleAlert className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-section-title text-danger-900">{title}</h3>
      <p className="mt-2 max-w-md text-body text-danger-800">{description}</p>
      {errorId && (
        <p className="mt-2 text-meta text-danger-700">
          Código do erro: {errorId}
        </p>
      )}
      {onRetry && (
        <Button className="mt-6" variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

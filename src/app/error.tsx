"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { PageContainer } from "@/components/layout/page-container";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer className="flex min-h-dvh items-center justify-center py-16">
      <ErrorState
        title="Não foi possível carregar a página"
        description="Ocorreu um erro inesperado ao renderizar este conteúdo. Tente novamente; se o problema persistir, volte mais tarde."
        errorId={error.digest}
        onRetry={reset}
        className="w-full max-w-xl"
      />
    </PageContainer>
  );
}

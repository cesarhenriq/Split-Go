import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { AppLogo } from "@/components/layout/app-logo";
import { routes } from "@/config/routes";
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";
import { requireGuest } from "@/lib/auth/current-user";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthLayoutFallback />}>
      <GuestOnlyLayout>{children}</GuestOnlyLayout>
    </Suspense>
  );
}

async function GuestOnlyLayout({ children }: { children: React.ReactNode }) {
  await requireGuest();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <AuthBrandPanel />

      <main
        id="conteudo-principal"
        className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <AppLogo href={routes.dashboard.home} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function AuthLayoutFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <LoadingState label="Verificando sessão..." />
    </div>
  );
}

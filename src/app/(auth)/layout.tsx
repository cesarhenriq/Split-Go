import { AppLogo } from "@/components/layout/app-logo";
import { routes } from "@/config/routes";
import { AuthBrandPanel } from "@/features/auth/components/auth-brand-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SkipLink } from "@/components/layout/skip-link";
import { useIsMobile } from "@/hooks/use-mobile";
import type { CurrentUser } from "@/lib/auth/types";

export type DashboardShellProps = {
  user: CurrentUser;
  pendingInvitationsCount?: number;
  children: React.ReactNode;
};

export function DashboardShell({
  user,
  pendingInvitationsCount = 0,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: close the drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <AppSidebar
        user={user}
        pendingInvitationsCount={pendingInvitationsCount}
        mobileOpen={mobileOpen}
        onMobileClose={closeMobile}
      />
      <div className="lg:pl-64">
        <AppHeader user={user} onMenuToggle={() => setMobileOpen(true)} />
        <main
          id="conteudo-principal"
          className="min-h-[calc(100dvh-4rem)]"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import {
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Receipt,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppLogo } from "@/components/layout/app-logo";
import { LogoutDialog } from "@/components/layout/logout-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { demoUser } from "@/config/demo";
import { type NavigationIcon, navigation, routes } from "@/config/routes";
import { cn } from "@/lib/utils";

const iconMap: Record<NavigationIcon, LucideIcon> = {
  LayoutDashboard,
  Users,
  Receipt,
  Wallet,
  Settings,
};

export type AppSidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function AppSidebar({
  mobileOpen = false,
  onMobileClose,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const mobileAsideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    const aside = mobileAsideRef.current;
    const closeButton = aside?.querySelector<HTMLElement>(
      'button[aria-label="Fechar menu"]',
    );

    closeButton?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onMobileClose?.();
        return;
      }

      if (event.key !== "Tab" || !aside) return;

      const focusable = Array.from(
        aside.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, onMobileClose]);

  const navContent = (
    <>
      <div className="flex h-16 items-center gap-3 px-4">
        <AppLogo href={routes.dashboard.home} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto lg:hidden"
          onClick={onMobileClose}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      <Separator />

      <nav
        aria-label="Navegação principal"
        className="flex-1 overflow-auto px-3 py-4"
      >
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              pathname === item.href ||
              (item.href !== routes.dashboard.home &&
                pathname.startsWith(`${item.href}/`));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onMobileClose?.()}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-neutral-600 hover:bg-surface-muted hover:text-foreground",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator />

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar fallback={demoUser.initials} alt={demoUser.name} size="md" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {demoUser.name}
            </span>
            <span className="truncate text-meta text-neutral-500">
              {demoUser.email}
            </span>
          </div>
        </div>
        <Badge variant="secondary">Dados de demonstração</Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => setLogoutOpen(true)}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair
        </Button>
      </div>
    </>
  );

  return (
    <>
      <aside
        aria-label="Barra lateral"
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface lg:flex"
      >
        {navContent}
      </aside>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-overlay lg:hidden"
            aria-hidden="true"
            onClick={onMobileClose}
          />
          <aside
            ref={mobileAsideRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface lg:hidden"
          >
            {navContent}
          </aside>
        </>
      )}

      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
}

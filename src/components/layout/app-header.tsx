"use client";

import { Bell, LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { LogoutDialog } from "@/components/layout/logout-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { demoUser } from "@/config/demo";
import { getBreadcrumbItems, getRouteTitle, routes } from "@/config/routes";

export type AppHeaderProps = {
  onMenuToggle?: () => void;
};

export function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const title = getRouteTitle(pathname);
  const breadcrumbItems = getBreadcrumbItems(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>

        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h1>
          <div className="hidden sm:block">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Notificações"
            className="h-10 w-10 text-foreground hover:bg-surface-muted"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <div className="px-2 py-6 text-center">
              <Bell
                className="mx-auto h-5 w-5 text-neutral-400"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm font-medium">Nenhuma notificação</p>
              <p className="mt-1 text-meta text-neutral-500">
                Você está em dia por aqui.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-surface-muted"
            aria-label="Abrir menu de perfil"
          >
            <Avatar
              fallback={demoUser.initials}
              alt={demoUser.name}
              size="sm"
            />
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-none">
                {demoUser.name}
              </p>
              <p className="mt-1 text-meta text-neutral-500">
                Dados de demonstração
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Conta de demonstração</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={routes.dashboard.settings}>
                <User className="mr-2 h-4 w-4" aria-hidden="true" />
                Meu perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={routes.dashboard.settings}>
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </header>
  );
}

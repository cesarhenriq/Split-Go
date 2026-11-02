export const routes = {
  auth: {
    login: "/login",
    register: "/register",
  },
  dashboard: {
    home: "/dashboard",
    groups: "/groups",
    expenses: "/expenses",
    settlements: "/settlements",
    settings: "/settings",
  },
} as const;

export const navigation = [
  {
    label: "Dashboard",
    href: routes.dashboard.home,
    icon: "LayoutDashboard",
  },
  { label: "Meus grupos", href: routes.dashboard.groups, icon: "Users" },
  { label: "Despesas", href: routes.dashboard.expenses, icon: "Receipt" },
  {
    label: "Quitações",
    href: routes.dashboard.settlements,
    icon: "Wallet",
  },
  {
    label: "Configurações",
    href: routes.dashboard.settings,
    icon: "Settings",
  },
] as const;

export type NavigationIcon = (typeof navigation)[number]["icon"];

export const routeTitles: Record<string, string> = {
  [routes.dashboard.home]: "Dashboard",
  [routes.dashboard.groups]: "Meus grupos",
  [routes.dashboard.expenses]: "Despesas",
  [routes.dashboard.settlements]: "Quitações",
  [routes.dashboard.settings]: "Configurações",
  [routes.auth.login]: "Entrar",
  [routes.auth.register]: "Criar conta",
};

function humanizeSegment(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getRouteTitle(pathname: string) {
  const fallbackSegment = pathname.split("/").filter(Boolean).at(-1);

  return (
    routeTitles[pathname] ??
    (fallbackSegment ? humanizeSegment(fallbackSegment) : "Split-Go")
  );
}

export function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;

    return {
      label: routeTitles[href] ?? humanizeSegment(segment),
      href: index === segments.length - 1 ? undefined : href,
    };
  });
}

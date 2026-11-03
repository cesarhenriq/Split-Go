export const routes = {
  auth: {
    login: "/login",
    register: "/register",
  },
  dashboard: {
    home: "/dashboard",
    groups: "/groups",
    invitations: "/invitations",
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
  {
    label: "Convites",
    href: routes.dashboard.invitations,
    icon: "Mail",
  },
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

export const protectedRoutes = [
  routes.dashboard.home,
  routes.dashboard.groups,
  routes.dashboard.invitations,
  routes.dashboard.expenses,
  routes.dashboard.settlements,
  routes.dashboard.settings,
] as const;

export const routeTitles: Record<string, string> = {
  [routes.dashboard.home]: "Dashboard",
  [routes.dashboard.groups]: "Meus grupos",
  [`${routes.dashboard.groups}/new`]: "Novo grupo",
  [routes.dashboard.invitations]: "Convites",
  [routes.dashboard.expenses]: "Despesas",
  [routes.dashboard.settlements]: "Quitações",
  [routes.dashboard.settings]: "Configurações",
  [routes.auth.login]: "Entrar",
  [routes.auth.register]: "Criar conta",
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function humanizeSegment(segment: string) {
  if (uuidPattern.test(segment)) {
    return "Detalhes do grupo";
  }

  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDynamicRouteTitle(pathname: string) {
  if (/\/groups\/[^/]+\/expenses\/new$/.test(pathname)) {
    return "Nova despesa";
  }

  if (/\/groups\/[^/]+\/expenses\/[^/]+\/edit$/.test(pathname)) {
    return "Editar despesa";
  }

  if (/\/groups\/[^/]+\/expenses\/[^/]+$/.test(pathname)) {
    return "Detalhes da despesa";
  }

  if (/\/groups\/[^/]+\/expenses$/.test(pathname)) {
    return "Despesas";
  }

  if (/\/groups\/[^/]+\/balances$/.test(pathname)) {
    return "Saldos";
  }

  return null;
}

export function getRouteTitle(pathname: string) {
  const fallbackSegment = pathname.split("/").filter(Boolean).at(-1);
  const dynamicTitle = getDynamicRouteTitle(pathname);

  return (
    routeTitles[pathname] ??
    dynamicTitle ??
    (fallbackSegment ? humanizeSegment(fallbackSegment) : "Split-Go")
  );
}

function getBreadcrumbLabel(href: string, segment: string) {
  if (routeTitles[href]) {
    return routeTitles[href];
  }

  if (/\/groups\/[^/]+\/expenses$/.test(href)) {
    return "Despesas";
  }

  if (/\/groups\/[^/]+\/expenses\/new$/.test(href)) {
    return "Nova despesa";
  }

  if (/\/groups\/[^/]+\/expenses\/[^/]+\/edit$/.test(href)) {
    return "Editar despesa";
  }

  if (/\/groups\/[^/]+\/expenses\/[^/]+$/.test(href)) {
    return "Detalhes da despesa";
  }

  if (/\/groups\/[^/]+\/balances$/.test(href)) {
    return "Saldos";
  }

  return humanizeSegment(segment);
}

export function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;

    return {
      label: getBreadcrumbLabel(href, segment),
      href: index === segments.length - 1 ? undefined : href,
    };
  });
}

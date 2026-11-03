import { getAppUrl } from "@/lib/env";

export const siteConfig = {
  name: "Split-Go",
  tagline: "Despesas compartilhadas sem complicação",
  description:
    "Organize grupos, divida despesas e acerte as contas com amigos de forma simples.",
  url: getAppUrl(),
} as const;

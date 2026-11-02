import { Check } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";

const highlights = [
  "Crie grupos para viagens, moradias ou eventos.",
  "Divida despesas de forma transparente com todos.",
  "Acompanhe quem deve o quê e acerte as contas.",
];

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-linear-to-br from-primary-700 via-primary-600 to-primary-800 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
      <AppLogo href={routes.dashboard.home} tone="inverse" />

      <div className="max-w-md space-y-6">
        <p className="text-meta font-semibold uppercase tracking-widest text-primary-100">
          Despesas compartilhadas
        </p>
        <h2 className="text-3xl font-bold leading-tight xl:text-4xl">
          {siteConfig.tagline}
        </h2>
        <p className="text-body text-primary-100">
          Uma visão clara do que cada pessoa pagou, do que ainda precisa ser
          dividido e de como acertar as contas sem planilhas paralelas.
        </p>
        <ul className="space-y-3">
          {highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Check className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="text-body text-primary-50">{highlight}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-meta text-primary-200">
        Ambiente de demonstração: nenhuma conta real é criada nesta etapa.
      </p>
    </aside>
  );
}

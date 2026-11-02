import {
  ArrowDownRight,
  ArrowUpRight,
  type LucideIcon,
  Scale,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";

type SummaryTone = "success" | "danger" | "primary" | "neutral";

type SummaryItem = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: SummaryTone;
};

const items: SummaryItem[] = [
  {
    label: "A receber",
    value: formatCents(124_000n),
    hint: "Saldo positivo ilustrativo",
    icon: ArrowUpRight,
    tone: "success",
  },
  {
    label: "A pagar",
    value: formatCents(-48_550n),
    hint: "Saldo devedor ilustrativo",
    icon: ArrowDownRight,
    tone: "danger",
  },
  {
    label: "Saldo geral",
    value: formatCents(75_450n),
    hint: "Diferença entre créditos e débitos",
    icon: Scale,
    tone: "primary",
  },
  {
    label: "Grupos ativos",
    value: "3",
    hint: "Grupos de demonstração",
    icon: Users,
    tone: "neutral",
  },
];

const valueTones: Record<SummaryTone, string> = {
  success: "text-success-700",
  danger: "text-danger-700",
  primary: "text-primary-700",
  neutral: "text-foreground",
};

const iconTones: Record<SummaryTone, string> = {
  success: "bg-success-50 text-success-600",
  danger: "bg-danger-50 text-danger-600",
  primary: "bg-primary-50 text-primary-600",
  neutral: "bg-neutral-100 text-neutral-600",
};

export function BalanceSummary() {
  return (
    <section aria-labelledby="resumo-financeiro" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="resumo-financeiro"
          className="text-section-title tracking-tight"
        >
          Resumo financeiro
        </h2>
        <Badge variant="secondary">Valores de demonstração</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body text-neutral-500">{item.label}</p>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      iconTones[item.tone],
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-3 text-2xl font-bold tracking-tight",
                    valueTones[item.tone],
                  )}
                >
                  {item.value}
                </p>
                <p className="mt-1 text-meta text-neutral-500">{item.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

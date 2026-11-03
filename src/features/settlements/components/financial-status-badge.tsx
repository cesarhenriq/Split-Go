import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { FinancialStatus } from "@/features/settlements/types";

const statusMap: Record<
  FinancialStatus,
  { label: string; variant: BadgeVariant }
> = {
  balanced: { label: "Totalmente equilibrado", variant: "success" },
  pending: { label: "Aguardando confirmação", variant: "warning" },
  partial: { label: "Parcialmente quitado", variant: "default" },
  open: { label: "Com pendências", variant: "danger" },
};

export function FinancialStatusBadge({ status }: { status: FinancialStatus }) {
  const config = statusMap[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

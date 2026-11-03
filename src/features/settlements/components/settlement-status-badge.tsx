import { Badge, type BadgeVariant } from "@/components/ui/badge";
import type { SettlementStatus } from "@/features/settlements/types";

const statusMap: Record<
  SettlementStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: "Pendente", variant: "warning" },
  CONFIRMED: { label: "Confirmado", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
};

export function SettlementStatusBadge({
  status,
}: {
  status: SettlementStatus;
}) {
  const config = statusMap[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

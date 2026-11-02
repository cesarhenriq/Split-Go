import { HandCoins } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";

export function SettlementsEmptyState() {
  return (
    <EmptyState
      icon={HandCoins}
      title="Nenhuma quitação registrada"
      description="Quando houver saldos a acertar entre os participantes, as sugestões de quitação aparecerão nesta página."
    />
  );
}

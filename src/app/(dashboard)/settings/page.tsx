import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { SettingsContent } from "@/features/settings/components/settings-content";

export const metadata: Metadata = {
  title: "Configurações",
};

export default function SettingsPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie seu perfil e as preferências da aplicação."
        action={<Badge variant="secondary">Demonstração</Badge>}
      />

      <SettingsContent />
    </PageContainer>
  );
}

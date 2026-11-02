import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsContent } from "@/features/settings/components/settings-content";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Configurações",
};

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie seu perfil e as preferências da aplicação."
      />

      <SettingsContent user={user} />
    </PageContainer>
  );
}

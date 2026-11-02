import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsContent } from "@/features/settings/components/settings-content";
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Configurações",
};

export default function SettingsPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie seu perfil e as preferências da aplicação."
      />

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContentLoader />
      </Suspense>
    </PageContainer>
  );
}

async function SettingsContentLoader() {
  const user = await requireUser();

  return <SettingsContent user={user} />;
}

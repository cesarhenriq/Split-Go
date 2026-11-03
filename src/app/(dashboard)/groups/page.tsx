import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { routes } from "@/config/routes";
import { GroupsPageContent } from "@/features/groups/components/groups-page-content";
import { GroupsSkeleton } from "@/features/groups/components/groups-skeleton";

export const metadata: Metadata = {
  title: "Meus grupos",
};

export default function GroupsPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Meus grupos"
        description="Organize as pessoas que compartilham despesas com você."
        action={
          <ButtonLink href={`${routes.dashboard.groups}/new`}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo grupo
          </ButtonLink>
        }
      />

      <Suspense fallback={<GroupsSkeleton />}>
        <GroupsPageContent />
      </Suspense>
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { GroupsEmptyState } from "@/features/groups/components/groups-empty-state";

export const metadata: Metadata = {
  title: "Meus grupos",
};

export default function GroupsPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Meus grupos"
        description="Organize as pessoas que compartilham despesas com você."
      />

      <GroupsEmptyState />
    </PageContainer>
  );
}

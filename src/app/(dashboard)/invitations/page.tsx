import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { InvitationsPageContent } from "@/features/invitations/components/invitations-page-content";
import { InvitationsSkeleton } from "@/features/invitations/components/invitations-skeleton";
import { RefreshInvitationsButton } from "@/features/invitations/components/refresh-invitations-button";

export const metadata: Metadata = {
  title: "Convites",
};

export default function InvitationsPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Convites"
        description="Convites recebidos para participar de grupos."
        action={<RefreshInvitationsButton />}
      />

      <Suspense fallback={<InvitationsSkeleton />}>
        <InvitationsPageContent />
      </Suspense>
    </PageContainer>
  );
}

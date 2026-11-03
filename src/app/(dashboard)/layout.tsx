import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";
import { getPendingInvitationsCount } from "@/features/groups/server/queries";
import { requireUser } from "@/lib/auth/current-user";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <AuthenticatedDashboardLayout>{children}</AuthenticatedDashboardLayout>
    </Suspense>
  );
}

async function AuthenticatedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const pendingInvitationsCount = await getPendingInvitationsCount(user.email);

  return (
    <DashboardShell
      user={user}
      pendingInvitationsCount={pendingInvitationsCount}
    >
      {children}
    </DashboardShell>
  );
}

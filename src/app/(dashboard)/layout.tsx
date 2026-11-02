import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardShellSkeleton } from "@/components/layout/dashboard-shell-skeleton";
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

  return <DashboardShell user={user}>{children}</DashboardShell>;
}

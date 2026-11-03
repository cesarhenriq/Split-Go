import { Users } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupsSkeleton } from "@/features/groups/components/groups-skeleton";
import { listGroupsForUser } from "@/features/groups/server/queries";
import { requireUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: "Despesas",
};

export default function ExpensesPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Despesas"
        description="Selecione um grupo para consultar e registrar despesas."
        action={
          <ButtonLink href="/groups" variant="outline">
            Meus grupos
          </ButtonLink>
        }
      />

      <Suspense fallback={<GroupsSkeleton />}>
        <ExpensesGroupsContent />
      </Suspense>
    </PageContainer>
  );
}

async function ExpensesGroupsContent() {
  const user = await requireUser();
  const groups = await listGroupsForUser(user.id);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum grupo disponível"
        description="Crie um grupo primeiro para começar a registrar despesas."
        action={<ButtonLink href="/groups/new">Criar grupo</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            <p className="text-body text-neutral-500">
              {group.memberCount}{" "}
              {group.memberCount === 1 ? "integrante" : "integrantes"}
            </p>
          </CardHeader>
          <CardContent>
            <ButtonLink
              href={`/groups/${group.id}/expenses`}
              variant="outline"
              className="w-full"
            >
              Ver despesas
            </ButtonLink>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

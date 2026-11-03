import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CreateGroupForm } from "@/features/groups/components/create-group-form";

export const metadata: Metadata = {
  title: "Novo grupo",
};

export default function NewGroupPage() {
  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Novo grupo"
        description="Crie um grupo e comece a organizar despesas compartilhadas."
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <CreateGroupForm />
        </CardContent>
      </Card>
    </PageContainer>
  );
}

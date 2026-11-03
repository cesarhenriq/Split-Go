"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RefreshInvitationsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      loading={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
      Atualizar
    </Button>
  );
}

"use client";

import Link from "next/link";
import { DemoNotice } from "@/components/feedback/demo-notice";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/config/routes";

export function LoginForm() {
  const { toast } = useToast();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast({
      variant: "info",
      title: "Autenticação em breve",
      description:
        "Esta é uma demonstração visual. Nenhum dado foi enviado ou validado.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-page-title tracking-tight">Entrar</h1>
        <p className="text-body text-neutral-500">
          Acesse sua conta para acompanhar grupos, despesas e quitações.
        </p>
      </div>

      <DemoNotice>
        Autenticação ainda não implementada. Use esta tela apenas para avaliar o
        layout.
      </DemoNotice>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Senha</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            required
          />
        </div>

        <Button type="submit" className="w-full" size="lg">
          Entrar
        </Button>
      </form>

      <p className="text-center text-body text-neutral-500">
        Ainda não tem uma conta?{" "}
        <Link
          href={routes.auth.register}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}

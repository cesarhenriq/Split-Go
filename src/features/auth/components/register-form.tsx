"use client";

import Link from "next/link";
import { DemoNotice } from "@/components/feedback/demo-notice";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { routes } from "@/config/routes";

export function RegisterForm() {
  const { toast } = useToast();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    toast({
      variant: "info",
      title: "Cadastro em breve",
      description:
        "Esta é uma demonstração visual. Nenhuma conta foi criada e nenhum dado foi enviado.",
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-page-title tracking-tight">Criar conta</h1>
        <p className="text-body text-neutral-500">
          Comece a organizar despesas compartilhadas em poucos passos.
        </p>
      </div>

      <DemoNotice>
        O cadastro será habilitado na etapa de autenticação. Por enquanto, esta
        tela é apenas uma prévia do layout.
      </DemoNotice>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="register-name">Nome completo</Label>
          <Input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">E-mail</Label>
          <Input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Senha</Label>
          <Input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Crie uma senha"
            aria-describedby="register-password-hint"
            required
          />
          <p id="register-password-hint" className="text-meta text-neutral-500">
            Use pelo menos 8 caracteres.
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg">
          Criar conta
        </Button>
      </form>

      <p className="text-center text-body text-neutral-500">
        Já possui uma conta?{" "}
        <Link
          href={routes.auth.login}
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

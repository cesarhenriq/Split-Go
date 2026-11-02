import { CalendarDays, Info, Settings, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";
import { ProfileForm } from "@/features/settings/components/profile-form";
import type { CurrentUser } from "@/lib/auth/types";

const preferences = [
  {
    title: "Notificações por e-mail",
    description: "Avisos sobre novas despesas e quitações pendentes.",
  },
  {
    title: "Resumo semanal",
    description: "Um panorama dos seus saldos e movimentações.",
  },
];

const aboutItems = [
  { label: "Aplicação", value: siteConfig.name },
  { label: "Versão", value: "0.1.0" },
];

export type SettingsContentProps = {
  user: CurrentUser;
};

export function SettingsContent({ user }: SettingsContentProps) {
  const createdAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(user.createdAt));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Perfil
          </CardTitle>
          <CardDescription>
            Atualize seu nome e e-mail. O identificador da conta não pode ser
            alterado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ProfileForm user={user} />

          <Separator />

          <div className="flex items-center gap-2 text-body text-neutral-500">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Conta criada em {createdAt}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Preferências
          </CardTitle>
          <CardDescription>
            Opções que estarão disponíveis em uma próxima etapa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul>
            {preferences.map((preference) => (
              <li
                key={preference.title}
                className="flex flex-col gap-2 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{preference.title}</p>
                  <p className="text-meta text-neutral-500">
                    {preference.description}
                  </p>
                </div>
                <Badge variant="secondary">Em breve</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Sobre
          </CardTitle>
          <CardDescription>
            Informações técnicas da versão em desenvolvimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aboutItems.map((item, index) => (
            <div key={item.label}>
              {index > 0 && <Separator />}
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-body text-neutral-500">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

import { Info, Settings, User } from "lucide-react";
import { DemoNotice } from "@/components/feedback/demo-notice";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { demoUser } from "@/config/demo";
import { siteConfig } from "@/config/site";

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
  { label: "Ambiente", value: "Demonstração" },
];

export function SettingsContent() {
  return (
    <div className="space-y-6">
      <DemoNotice>
        Esta tela é somente leitura nesta etapa. A edição de perfil e as
        preferências serão habilitadas com a autenticação.
      </DemoNotice>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" aria-hidden="true" />
            Perfil
          </CardTitle>
          <CardDescription>
            Informações básicas da conta de demonstração.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Nome</Label>
              <Input id="settings-name" defaultValue={demoUser.name} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email">E-mail</Label>
              <Input
                id="settings-email"
                type="email"
                defaultValue={demoUser.email}
                disabled
              />
            </div>
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

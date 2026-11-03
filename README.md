# Split-Go

Plataforma de divisão de despesas entre pessoas e grupos. O projeto permite criar grupos, convidar integrantes, registrar despesas com diferentes métodos de rateio, calcular saldos, gerar um plano simplificado de pagamentos e registrar/confirmar quitações.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- PostgreSQL 17
- Drizzle ORM
- Tailwind CSS
- Zod
- Vitest
- Playwright

A interface usa apenas componentes próprios com Tailwind CSS.

## Arquitetura resumida

```text
src/
  app/                  Rotas e layouts do App Router
  components/           Componentes de UI, layout e feedback
  config/               Configuração de rotas, navegação e site
  db/                   Conexão, schema e tipos do Drizzle
  features/
    auth/               Cadastro, login, logout e sessões
    groups/             Grupos, integrantes e convites
    invitations/        Convites recebidos
    expenses/           Despesas, rateios e cálculos
    balances/           Saldos e plano simplificado
    settlements/        Pagamentos, confirmação, extrato e painel
    settings/           Perfil do usuário
  lib/                  Dinheiro, datas, validações, segurança e finanças
  test-utils/           Utilitários de banco de testes
drizzle/migrations/     Migrations versionadas
e2e/                    Testes end-to-end com Playwright
scripts/                Seed, preparação do banco e utilitários
```

### Regras financeiras principais

- Valores monetários são persistidos em centavos com `bigint`/`BIGINT`.
- A soma dos rateios de uma despesa deve ser exatamente igual ao total.
- A soma dos saldos do grupo deve ser zero.
- Apenas pagamentos `CONFIRMED` alteram os saldos.
- Pagamentos `PENDING` reservam disponibilidade, mas não quitam dívidas.
- O plano de pagamentos é apenas uma sugestão; ele não cria quitações automaticamente.
- Operações financeiras críticas usam transações e locks por grupo.
- Pagamentos confirmados não podem ser editados ou cancelados nesta etapa.

## Requisitos

- Node.js 20.9 ou superior (recomendado: Node.js 22)
- npm 10 ou superior
- PostgreSQL 17
- Docker e Docker Compose (opcional, para o banco local)

## Instalação local

1. Clone o repositório e acesse a pasta:

```bash
git clone https://github.com/cesarhenriq/Split-Go.git
cd Split-Go
```

2. Instale as dependências com o lockfile:

```bash
npm ci
```

3. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

4. Suba o PostgreSQL local:

```bash
docker compose up -d
```

5. Aplique as migrations:

```bash
npm run db:migrate
```

6. Opcionalmente, crie usuários de demonstração:

```bash
npm run db:seed
```

Usuários criados de forma idempotente:

```text
ana@splitgo.dev
bruno@splitgo.dev
carla@splitgo.dev
diego@splitgo.dev
```

A senha padrão de desenvolvimento é `senha-segura-123`. Defina `SEED_USER_PASSWORD` para usar outra senha. O script não altera usuários existentes e recusa execução em produção sem uma senha configurada.

7. Inicie a aplicação:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis de ambiente

Use `.env.example` como referência. Nunca versione o `.env` real.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Conexão de runtime. Em produção, use a URL com pooler. |
| `DIRECT_URL` | Para migrations | Conexão direta usada pelo Drizzle Kit. |
| `NEXT_PUBLIC_APP_URL` | Em produção | URL pública da aplicação. |
| `DB_POSTGRES_USER` | Docker local | Usuário do PostgreSQL local. |
| `DB_POSTGRES_PASSWORD` | Docker local | Senha do PostgreSQL local. |
| `DB_POSTGRES_DB` | Docker local | Nome do banco local. |
| `DB_POOL_MAX` | Não | Máximo de conexões por instância. Padrão: `5`. |
| `SEED_USER_PASSWORD` | Não | Senha dos usuários criados pelo seed. |
| `RATE_LIMIT_*` | Não | Overrides dos limites de login, cadastro e convites. |

Não existe segredo separado de autenticação: as sessões usam tokens aleatórios, armazenados apenas como hash SHA-256 no banco.

## Banco de dados

### Desenvolvimento

```bash
npm run db:migrate
```

### Testes de integração

O script abaixo recria o banco de teste e aplica todas as migrations. Ele **apaga o schema** do banco de teste; nunca aponte `TEST_DATABASE_URL` para produção.

```bash
npm run db:test:prepare
```

O banco de teste padrão é `splitgo_test`, derivado de `DATABASE_URL`. Também é possível definir `TEST_DATABASE_URL`; o nome precisa terminar em `_test`.

### Migrations

- As migrations ficam em `drizzle/migrations` e são versionadas.
- Use `npm run db:generate` para gerar uma nova migration.
- Use `npm run db:migrate` para aplicar migrations.
- Use `npm run db:check` para validar o histórico.
- **Não use `drizzle-kit push` em produção.**

## Testes

### Unitários

```bash
npm run test:unit
```

Cobrem validações, dinheiro, rateios, simplificação de dívidas, cálculo de saldos e formatação de datas.

### Integração

Requer PostgreSQL local ou um banco de teste acessível.

```bash
npm run test:integration
```

Cobrem autenticação, sessões, grupos, convites, despesas, saldos, pagamentos, extrato, permissões, concorrência e rate limiting.

### End-to-end

Instale o navegador Chromium uma vez:

```bash
npm run test:e2e:install
```

Depois execute:

```bash
npm run test:e2e
```

O Playwright sobe um servidor de desenvolvimento em `http://127.0.0.1:3100`, usando o banco de teste. Ele usa `next dev` porque o cookie de sessão é `Secure` em produção e os testes locais rodam em HTTP.

Cenários cobertos:

1. Cadastro, login, logout e proteção de rotas.
2. Criação de grupo, convite e aceite.
3. Despesas e rateios.
4. Simplificação de dívidas e plano de pagamentos.
5. Registro de pagamento, confirmação, histórico e extrato.

### Qualidade

```bash
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

## CI/CD

O workflow `.github/workflows/ci.yml` executa em Pull Requests e pushes para `develop`/`main`:

- lint;
- typecheck;
- testes unitários;
- testes de integração com PostgreSQL 17;
- build de produção;
- testes E2E com Playwright.

Nenhuma credencial real é usada no CI. O PostgreSQL é um service container local do runner.

A Vercel deve continuar usando a integração nativa com o GitHub. O workflow não faz deploy automático.

## Deploy na Vercel

### 1. Banco PostgreSQL

Recomenda-se Neon:

1. Crie um projeto no Neon.
2. Use a connection string **pooled** como `DATABASE_URL` de runtime.
3. Use a connection string **direct** como `DIRECT_URL` para migrations.
4. Mantenha `sslmode=require` na URL.

### 2. Projeto na Vercel

1. Importe o repositório na Vercel.
2. Framework: Next.js.
3. Build command: `npm run build`.
4. Install command: `npm ci`.
5. Configure as variáveis:
   - `DATABASE_URL` (pooled);
   - `DIRECT_URL` (direct);
   - `NEXT_PUBLIC_APP_URL` com a URL pública de produção;
   - `DB_POOL_MAX` opcional.
6. Não configure `SEED_USER_PASSWORD` em produção sem necessidade.

### 3. Migrations de produção

As migrations **não** rodam automaticamente no build ou no start da aplicação. Execute uma única vez, em um ambiente confiável ou job de CI:

```bash
DIRECT_URL="postgresql://..." DATABASE_URL="postgresql://..." npm run db:migrate
```

Antes:

```bash
npm run db:check
```

Evite executar migrations em múltiplas instâncias ao mesmo tempo.

### 4. Primeiro deploy

Após configurar as variáveis e aplicar as migrations:

1. Faça o deploy pela Vercel.
2. Acesse a URL pública.
3. Valide cadastro/login.
4. Crie um grupo e uma despesa.
5. Registre e confirme um pagamento.
6. Verifique o painel financeiro, o histórico e o extrato.

## Segurança

- Senhas com Argon2id.
- Tokens de sessão aleatórios armazenados como hash.
- Cookie `HttpOnly`, `Secure` em produção e `SameSite=Lax`.
- Autorização verificada no backend por grupo e por recurso.
- Validação de entrada com Zod nas Server Actions.
- Consultas parametrizadas via Drizzle.
- Rate limiting persistido no PostgreSQL para login, cadastro e convites.
- Headers de segurança básicos configurados no Next.js.
- Nenhum segredo versionado.

### Limitações conhecidas

- Não há envio de e-mail nem verificação de e-mail; convites são exibidos dentro da aplicação.
- Não há recuperação de senha.
- Pagamentos confirmados são imutáveis; não há estorno implementado.
- A CSP completa não está configurada porque os scripts inline do Next exigiriam nonce/proxy.
- As páginas globais `/expenses` e `/settlements` são apenas informativas; o fluxo completo está nas rotas de cada grupo.

## Comandos

```bash
npm run dev             # desenvolvimento
npm run build           # build de produção
npm run start           # servidor de produção
npm run lint            # lint e formatação
npm run typecheck       # TypeScript
npm run test            # testes unitários em watch
npm run test:unit       # testes unitários
npm run test:integration # testes de integração
npm run test:e2e        # testes end-to-end
npm run test:e2e:install # instala o Chromium do Playwright
npm run db:generate     # gera migration
npm run db:migrate      # aplica migrations
npm run db:seed         # cria usuários de demonstração
npm run db:check        # valida histórico de migrations
npm run db:studio       # Drizzle Studio
```

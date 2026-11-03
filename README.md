# Split-Go

Plataforma de divisão de despesas entre grupos.

## Configuração local

1. Instale as dependências:

```bash
npm install
```

2. Suba o PostgreSQL:

```bash
docker compose up -d
```

3. Configure o `.env` a partir de `env.example`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/splitgo
DIRECT_URL=postgresql://usuario:senha@localhost:5432/splitgo
```

4. Aplique as migrations:

```bash
npm run db:setup
```

## Seed de usuários

Para criar usuários de demonstração que podem ser convidados:

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

Senha padrão de desenvolvimento:

```text
senha-segura-123
```

Defina `SEED_USER_PASSWORD` para usar outra senha. O script não altera usuários
já existentes e não executa operações destrutivas.

## Comandos

```bash
npm run dev          # ambiente de desenvolvimento
npm run build        # build de produção
npm run start        # servidor de produção
npm run lint         # lint e formatação
npm run test:run     # testes unitários
npm run test:db      # testes de integração com PostgreSQL
npm run db:generate  # gera nova migration
npm run db:migrate   # aplica migrations pendentes
npm run db:seed      # cria usuários de demonstração
npm run db:check     # valida o histórico de migrations
npm run db:studio    # abre o Drizzle Studio
```

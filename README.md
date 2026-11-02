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
npm run db:check     # valida o histórico de migrations
npm run db:studio    # abre o Drizzle Studio
```

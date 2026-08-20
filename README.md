# DeskFlow

Sistema de helpdesk / gestão de chamados (tickets), construído como reescrita de um
legado (Zammad). Monorepo com backend **NestJS** + frontend **Vue 3**.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 11, TypeORM, PostgreSQL 16, Redis (BullMQ), Elasticsearch |
| Frontend | Vue 3, Vite, Pinia, Tailwind, vue-router |
| Infra | Docker Compose (PostgreSQL, Redis, Elasticsearch) |

## Pré-requisitos

- Node.js `^22.18` ou `>=24.12` (ver `engines` em `frontend/package.json`)
- Docker + Docker Compose

## Estrutura

```
DeskFlow/
├── backend/          # API NestJS (porta 3000)
│   ├── src/          # módulos (tickets, iam, email, whatsapp, ...)
│   ├── scripts/      # reset.js, seed-admin.js, check-roles.js
│   └── .env.example  # template de variáveis de ambiente
├── frontend/         # App Vue 3 (Vite, porta 5173)
├── docker-compose.yml
└── temp/             # notas de retomada e gap analysis
```

## Como subir (desenvolvimento)

### 1. Infraestrutura

```bash
docker compose up -d
```

Sobe:
- PostgreSQL em `localhost:5434` (usuário/senha/banco: `deskflow`/`deskflow_password`/`deskflow_db`)
- Redis em `localhost:6380` (porta 6380 é intencional)
- Elasticsearch em `localhost:9200`

### 2. Backend

```bash
cd backend
cp .env.example .env   # ajuste as credenciais se necessário
npm install
npm run start:dev       # API em http://localhost:3000
```

### 3. Seed do usuário admin (opcional, para o primeiro acesso)

```bash
cd backend
npm run db:seed-admin   # cria admin@example.com / admin123
```

Outros utilitários: `npm run db:reset` (reseta senha/vínculo de role do admin) e
`npm run db:check-roles`.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

O frontend aponta para `http://localhost:3000` por padrão (ver `frontend/src/services/api.ts`).

## Variáveis de ambiente

Consulte `backend/.env.example` para a lista completa (banco, Redis, Elasticsearch,
SMTP/IMAP/POP3, Microsoft Graph, canais). As credenciais externas (SMS, Facebook,
Telegram, SSO/OAuth, CTI, PGP/S-MIME, importadores) são config-driven via `Settings`/`.env`.

> O `.env` real não é versionado (está no `.gitignore`).

## Scripts úteis

| Comando | Onde | Descrição |
|---|---|---|
| `npm run start:dev` | backend | Sobe a API em watch mode |
| `npm run test` | backend | Testes unitários (Jest) |
| `npm run test:e2e` | backend | Testes e2e |
| `npm run db:seed-admin` | backend | Seed do usuário admin |
| `npm run dev` | frontend | Dev server (Vite) |
| `npm run build` | frontend | Build + type-check (`vue-tsc`) |
| `npm run test:unit` | frontend | Testes unitários (Vitest) |

## Notas

- `synchronize` do TypeORM é controlado por `DB_SYNCHRONIZE` (default `true` em dev).
  Não há migrations pois o banco é criado do zero; habilite migrations apenas quando
  houver schema em produção.
- O projeto foi implementado a partir de engenharia reversa do legado Zammad
  (artefatos de análise em `zammad-develop/_reversa_sdd/`).

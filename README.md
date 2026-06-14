# LabCollab

Совместный электронный лабораторный журнал (ELN) для малых НИР-групп.

## Monorepo (Nx + Bun)

```
apps/web      — React, Vite, Mantine, Effector, Farfetched, TipTap
apps/api      — Elysia, Drizzle, PostgreSQL
packages/shared
docs/         — документация
```

## Быстрый старт (разработка)

```bash
bun install

# PostgreSQL
docker compose up -d postgres

# миграции и демо-данные
cd apps/api && bunx drizzle-kit migrate
cd ../.. && bun run db:seed

# два терминала
bun run dev:api    # :3000
bun run dev:web    # :4200
```

Демо-логин после seed: `alice@lab.local` / `password123` (второй пользователь: `bob@lab.local`).

## Self-hosted (production)

```bash
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:3000

Скопируйте `.env.example` → `.env` и измените секреты.

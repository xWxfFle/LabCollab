# LabCollab

Совместный электронный лабораторный журнал (ELN) для малых НИР-групп: структурированные эксперименты, документация проекта и совместная работа без тяжёлых ELN и внешних SaaS.

## Возможности

### Проекты и workspace

- Несколько проектов на пользователя, роли **владелец / редактор / наблюдатель**
- Единое **дерево**: папки, doc-страницы (TipTap) и эксперименты
- Поиск и фильтры в сайдбаре (статус, теги)
- Переименование и перемещение узлов workspace

### Записи экспериментов

- **Настраиваемые шаблоны**
- **Чеклист** по шаблону, статусы
- **Теги**
- **Вложения**: JPG, PNG, PDF, CSV, XLSX (до 10 МБ)

### Версии и экспорт

- **История версий** экспериментов и doc-страниц, просмотр снапшотов
- **Экспорт PDF** эксперимента; doc-страниц — PDF и Markdown
- Внутренние ссылки TipTap на страницы и эксперименты проекта

### Интерфейс и развёртывание

- **Self-hosted**: `docker compose` - web, API, PostgreSQL, локальное хранилище файлов
- Адаптивный UI (мобильный сайдбар), **светлая и тёмная тема**

## Monorepo (Nx + Bun)

```
apps/web      — React, Vite, Mantine, Effector, Farfetched, TipTap
apps/api      — Elysia, Drizzle, PostgreSQL
packages/shared
docs/         — документация (локально, в .gitignore)
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

**Демо-логин** после seed: `alice@lab.local` / `password123` (также `bob@lab.local`, `carol@lab.local` — viewer в первом проекте).

**Демо-данные:** 3 проекта, workspace (папки, страницы, эксперименты), личные шаблоны, комментарии и версии.

## Self-hosted (production)

```bash
docker compose up --build
```

- Web: http://localhost:8080
- API: http://localhost:3000

Скопируйте `.env.example` в `.env` и измените секреты.

## Стек технологий

### Frontend

- React 19, TypeScript, Vite
- Mantine UI v9, Tabler Icons
- @argon-router - роутинг, lazy pages, auth chains
- Effector + patronum - состояние
- @effector-reform + Zod - формы и валидация
- Farfetched + @farfetched/zod - HTTP queries/mutations
- @mantine/tiptap, TipTap StarterKit - rich-text
- Feature-Sliced Design

### API

- ElysiaJS - REST API, TypeBox
- Drizzle ORM, drizzle-kit - схема и миграции
- PostgreSQL 16
- @elysiajs/jwt + bcrypt - аутентификация
- multipart upload - вложения
- Playwright - экспорт PDF

### Инфраструктура

- Nx + Bun workspaces - monorepo
- `packages/shared` - общие типы и Zod-схемы
- Docker, Docker Compose

## Поддержка

По вопросам и сотрудничеству: [@xWxfFle](https://t.me/xWxfFle) в Telegram.

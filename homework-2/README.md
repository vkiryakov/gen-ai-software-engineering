# 🎧 Homework 2: Intelligent Customer Support System

> **Student Name**: Volodymyr Kiryakov
> **AI Tools Used**: Claude Code

Turborepo-монорепозиторий: NestJS API + Next.js web + общие пакеты.

## Структура

```text
apps/
  api/                 # NestJS 11 — REST API (порт 3001), GET /health
  web/                 # Next.js 16 (App Router, Tailwind) — UI (порт 3000)
packages/
  contracts/           # @repo/contracts — zod-схемы и общие типы
  eslint-config/       # @repo/eslint-config — общие eslint-пресеты (base, nest)
  typescript-config/   # @repo/typescript-config — общие tsconfig (base, nest, next)
```

## Запуск

Требования: Node >= 22, pnpm 10.

```bash
pnpm install
pnpm dev        # api на :3001, web на :3000
```

Прочие команды: `pnpm build`, `pnpm lint`, `pnpm test`.

Переменные окружения — см. `apps/api/.env.example` и `apps/web/.env.example`.

## Статус

Каркас монорепозитория. Функциональность тикетов (CRUD, импорт CSV/JSON/XML,
автоклассификация) — следующие этапы, задание см. в `TASKS.md`.

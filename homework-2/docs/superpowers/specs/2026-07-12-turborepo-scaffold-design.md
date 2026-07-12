# Turborepo Scaffold: NestJS + Next.js — Design

**Date:** 2026-07-12
**Scope:** Каркас монорепозитория для Homework 2 (Intelligent Customer Support System). Только инфраструктура — функциональность тикетов реализуется отдельными последующими шагами.

## Цель

Создать в `homework-2/` рабочий turborepo-монорепозиторий на pnpm с двумя приложениями (NestJS API и Next.js web) и общими пакетами, который собирается, линтуется и запускается одной командой.

## Решение

Ручной каркас: `pnpm-workspace.yaml` и `turbo.json` пишутся вручную, приложения генерируются официальными CLI (`nest new`, `create-next-app`) и подключаются к воркспейсу.

Отвергнутые альтернативы:
- `create-turbo@latest` — создаёт лишние Next.js-приложения (web + docs), NestJS всё равно добавлять вручную.
- Восстановление из git-истории (коммит 601c537^) — содержит всю старую функциональность, противоречит объёму «только каркас».

## Структура

```
homework-2/
├── package.json            # приватный корень; скрипты dev/build/lint/test через turbo
├── pnpm-workspace.yaml     # apps/*, packages/*
├── turbo.json              # таски: build (dependsOn ^build), dev (persistent), lint, test
├── .gitignore, .prettierrc
├── apps/
│   ├── api/                # NestJS 11, TypeScript, порт 3001
│   └── web/                # Next.js 16, App Router, TypeScript, Tailwind, порт 3000
└── packages/
    ├── contracts/          # @repo/contracts — zod, общие типы; пока заглушка index.ts
    ├── eslint-config/      # @repo/eslint-config — пресеты base / nest
    └── typescript-config/  # @repo/typescript-config — base / nest / next tsconfig
```

## Компоненты

**apps/api (NestJS):**
- Стандартная структура `nest new`, порт 3001 (env `PORT`, дефолт 3001).
- Health-check: `GET /health` → `{ "status": "ok" }`.
- CORS включён для `http://localhost:3000`.
- Jest: один smoke-тест health-контроллера.
- Зависит от `@repo/contracts`, использует общие eslint/tsconfig пресеты.

**apps/web (Next.js):**
- App Router, TypeScript, Tailwind, без каталога `src` (`--no-src-dir`).
- Стартовая страница запрашивает `GET /health` у API (env `NEXT_PUBLIC_API_URL`, дефолт `http://localhost:3001`) и показывает статус подключения.
- Зависит от `@repo/contracts`, общие пресеты.
- Тестов на этапе каркаса нет.

**packages/contracts:** экспортирует заглушку (например, `export const CONTRACTS_VERSION = '0.0.1'`) + установлен zod; наполняется схемами в следующих задачах.

**packages/eslint-config, packages/typescript-config:** стандартный turborepo-паттерн общих конфигов. eslint-config даёт пресеты `base` и `nest`; web оставляет сгенерированный `eslint-config-next` (комбинация двух экземпляров typescript-eslint в одном flat-конфиге вызывает конфликт плагинов).

## Потоки и ошибки

- `pnpm dev` из корня homework-2 запускает api и web параллельно через turbo.
- Web показывает явное состояние «API недоступен», если health-check упал — это единственный обрабатываемый сценарий ошибки на этапе каркаса.

## Критерии приёмки

1. `pnpm install` проходит без ошибок.
2. `pnpm build` собирает оба приложения и contracts.
3. `pnpm lint` и `pnpm test` проходят (test: smoke-тест api).
4. `pnpm dev`: `GET http://localhost:3001/health` отвечает `{"status":"ok"}`; `http://localhost:3000` открывается и показывает статус API «ok».
5. README.md homework-2 обновлён: заголовок Homework 2, описание структуры монорепо и команд запуска.

## Вне объёма

CRUD тикетов, импорт CSV/JSON/XML, автоклассификация, UI-страницы тикетов, покрытие тестами >85%, документация API — всё это последующие задачи Homework 2.

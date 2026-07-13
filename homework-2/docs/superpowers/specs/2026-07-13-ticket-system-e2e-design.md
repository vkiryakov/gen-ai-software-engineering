# Ticket System UI: полноценный Next.js фронтенд — Design

**Дата:** 2026-07-13 (ревизия: заменяет первую версию того же дня — переезд с "обёртки над статикой" на полный переезд в Next.js/TSX)
**Область:** Task 5 из `TASKS.md` — реализовать настоящий React/Next.js фронтенд, подключённый к `apps/api`, взамен статического прототипа на React UMD + Babel Standalone (`apps/web/public/ticket-system/`, коммит `666f23a`). Бэкенд (`apps/api`) не меняется — см. `docs/superpowers/specs/2026-07-12-ticket-api-design.md`.

## Контекст и решение

Статический прототип (`public/ticket-system/`) послужил эталоном UX и визуального языка ("Triage" design system), но:
- собран на React 18 UMD + Babel Standalone (транспиляция JSX в браузере, без сборки) — не то, что ожидается от "нормального Next-приложения";
- работает в mock-режиме (`app/mock-api.js`) с фейковым логином.

**Решение:** переносим всё в `apps/web/app` как настоящие `.tsx`-компоненты, компилируемые Next.js. Моки убираем полностью — экран логина и все операции с тикетами всегда бьют в реальный `apps/api`. `public/ticket-system/` удаляется целиком после переноса (весь функционал переезжает в `app/`; держать параллельный дубль на другом стеке — источник путаницы и дрейфа).

Дизайн-система не пишется с нуля: `_ds_bundle.js` — не минифицированный, конкатенированный из читаемых JSX-исходников (см. манифест `@ds-bundle` в первой строке файла: 21 компонент с путями типа `components/buttons/Button.jsx`). Каждый примитив портируется в `.tsx` построчно с сохранением инлайн-стилей и CSS custom properties — визуальный результат не должен отличаться. Токены (`tokens/*.css`, `styles.css`) — обычный CSS, переносятся файлами без изменений.

## Архитектура

```
apps/web/
├── app/
│   ├── layout.tsx                 # добавляет <link> на design-tokens.css (глобальные токены)
│   ├── globals.css                 # + @import design-tokens.css, инлайн responsive-правила
│   │                                  из <style> Ticket System.html (breakpoint 860px)
│   └── page.tsx                    # server component: читает NEXT_PUBLIC_API_URL,
│                                      рендерит <TriageApp apiBaseUrl={API_URL} />
├── components/ticket-system/
│   ├── TriageApp.tsx                # 'use client' — корневой стейт-машин (login → app),
│   │                                  = нынешний App()+AgentApp() из инлайн-скрипта
│   ├── LoginScreen.tsx
│   ├── TopBar.tsx
│   ├── Toast.tsx
│   ├── Sidebar.tsx
│   ├── TicketList.tsx              # + TicketRow, FilterPopover (внутренние, не экспортируются)
│   ├── TicketDetail.tsx            # + PropRow, ClassificationPanel, EmptyDetail
│   ├── TicketFormModal.tsx
│   ├── ImportModal.tsx
│   └── ds/                         # порт design-system примитивов из _ds_bundle.js
│       ├── Button.tsx, IconButton.tsx
│       ├── Input.tsx, Textarea.tsx, Select.tsx, Checkbox.tsx, FieldLabel.tsx
│       ├── Badge.tsx, PriorityTag.tsx, StatusTag.tsx, Avatar.tsx
│       ├── Banner.tsx, Spinner.tsx, Tooltip.tsx
│       ├── Tabs.tsx, NavItem.tsx
│       └── Modal.tsx
├── lib/ticket-system/
│   ├── api.ts                      # типизированный REST-клиент (fetch), включает login()
│   ├── constants.ts                 # = TRIAGE_META: labels, STATUS_TAG-маппинг, queues, relative()
│   │                                  категории/приоритеты/статусы — литералы из @repo/contracts enums,
│   │                                  не дублируем строки руками
│   └── types.ts                     # локальные UI-типы (Toast, QueueId, ...), Ticket/Ticket* — из @repo/contracts
└── public/
    └── (design-tokens.css, tokens/*.css — статические файлы, см. ниже)
```

`public/ticket-system/` целиком удаляется (html, app/*.jsx, mock-api.js, README.md, `_ds/` бандл) — токен-CSS переносится (не копируется бинарно, а переезжает) в `apps/web/public/design-tokens/`, на него ссылается `app/layout.tsx`.

## Design system: как портируем примитивы

Для каждого из 21 компонента в манифесте `_ds_bundle.js` беру соответствующий блок кода (между `// components/.../X.jsx` и следующим таким комментарием), перевожу IIFE-обёртку и `window.TriageDesignSystem_a9a780.X = X` в обычный `export function X(props: XProps) { ... }`, добавляю пропсам TypeScript-типы по фактическому использованию в `Sidebar.jsx`/`TicketList.jsx`/`TicketDetail.jsx`/`TicketFormModal.jsx`/`ImportModal.jsx` (там видно каждый вызов с конкретными пропсами). Все `var(--...)` CSS custom properties остаются как есть — они определены в перенесённых `tokens/*.css`, фреймворк-агностичны.

**Иконки.** Заменяю `<i data-lucide="x" style={{...}} />` + глобальный `window.lucide.createIcons()` (вызывался в `useEffect` после каждого рендера) на `lucide-react` (добавляется в зависимости `apps/web/package.json`) — те же имена иконок как именованные экспорты (`X`, `Search`, `Upload`, ...), `size`/`className` вместо ручного `style={{ width, height }}`. Убирает необходимость в CDN-скрипте и ручном re-run для динамически появляющихся иконок (частый источник багов в исходном прототипе — иконки в модалках иногда не отрисовывались без лишнего `createIcons()`).

**Шрифты.** `tokens/fonts.css` сейчас тянет Google Fonts через `@import` — оставляем как есть (не самоцель этой задачи оптимизировать через `next/font`).

## API-клиент (`lib/ticket-system/api.ts`)

Прямой порт `app/api.js` без mock-ветки, с типами из `@repo/contracts`:

```ts
import type { Ticket, CreateTicketInput, UpdateTicketInput } from '@repo/contracts';

export class ApiError extends Error { constructor(message: string, public status?: number) { super(message); } }

export function createApiClient(baseUrl: string, getToken: () => string | null) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> { /* ... */ }
  return {
    login(email: string, password: string) { /* POST /auth/login, без токена */ },
    listTickets(filters: TicketFilters) { /* GET /tickets?... */ },
    getTicket(id: string) { /* ... */ },
    createTicket(input: CreateTicketInput) { /* ... */ },
    updateTicket(id: string, patch: UpdateTicketInput) { /* ... */ },
    deleteTicket(id: string) { /* ... */ },
    classifyTicket(id: string) { /* ... */ },
    importTickets(file: File) { /* multipart/form-data */ },
  };
}
```

401 в `request()` — кидает специальный `ApiError` со статусом 401; `TriageApp` перехватывает его в каждом обработчике и делает logout (сброс токена + возврат на `LoginScreen`), а не просто показывает баннер.

## Аутентификация и состояние

`TriageApp.tsx` держит стейт-машину `'login' | 'app'` (как сейчас `App()`), плюс `token`/`email` в `useState`, синхронизированные с `localStorage` (ключ `triage_token`, без обёртки `TriageConfig` — она была нужна для mock/live переключателя, которого больше нет). При маунте — если в `localStorage` есть токен, сразу открывает `'app'` (пропускает логин между визитами), а не всегда стартует с экрана логина, как было в прототипе. Логаут чистит `localStorage` и возвращает на `'login'`.

`apiBaseUrl` приходит пропом с сервера (`process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'`) — без глобального `window.__API_BASE_URL__`, это был артефакт схемы "статика + инъекция", здесь просто React-проп.

## Responsive-поведение

CSS-правила из `<style>` в `Ticket System.html` (drawer-сайдбар и стек list/detail на `max-width: 860px`) переезжают в `globals.css` как есть (те же классы `.triage-sidebar`, `.triage-mobile-only`, `.triage-sidebar-backdrop`, `.triage-list-pane`, `.triage-detail-pane`, `.triage-filter-popover`, `.triage-collapse-toggle` — компоненты уже расставляют эти классы, логика не меняется).

## Известное ограничение

Очередь "Assigned to me" и вкладка "Assigned to me" в `TicketList` фильтруют по жёстко зашитому id `'priya'` — у бэкенда нет модели агентов, `assigned_to` в API это произвольная строка. Оставляем как есть (соответствует прототипу), фиксируем в README как заведомое ограничение — полноценную систему агентов/пользователей не строим, вне объёма ДЗ.

## Проверка

Нет автотестов для фронтенда (Task 5 в `TASKS.md` их не требует — тестовые требования Task 3/6 касаются только `apps/api`). Проверка вручную:
1. `pnpm dev` в `apps/api` и `apps/web` параллельно.
2. `http://localhost:3000/` → экран логина Triage.
3. Неверный пароль → баннер с реальным текстом ошибки `/auth/login` (не демо-правило "wrong").
4. `admin@ignore.com` / `123` → список тикетов (пустой при старте — in-memory хранилище).
5. Create → Edit → Classify → Apply → Import (`apps/api/test/fixtures/tickets-valid.csv`) → Delete — каждое действие проверяется в Network-табе как реальный запрос к `apps/api`, ответы применяются в UI.
6. Resize < 860px — drawer-сайдбар, list/detail стек с `showBack`.
7. Logout → `localStorage` не содержит токен; reload на `app`-шаге без токена → возврат на логин.
8. `pnpm build` в `apps/web` проходит (типы, лint) — критично, т.к. раньше сборки не было вообще.

## Вне объёма

- Система агентов/пользователей (см. ограничение выше).
- Автотесты фронтенда (не требуются TASKS.md для Task 5).
- Оптимизация шрифтов через `next/font`, self-hosting шрифтов/иконок.
- Настройки/переключатель окружений в UI (`apiBaseUrl` — только через env, как и раньше).

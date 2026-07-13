# Ticket API (apps/api): CRUD, импорт, автоклассификация, аутентификация — Design

**Дата:** 2026-07-12
**Область:** Реализация `apps/api` (NestJS) для Homework 2 — Tasks 1, 2, 3, 6 из `TASKS.md`. Task 4 (документация) и Task 5 (фронтенд) — вне объёма; статический прототип в `apps/web/public/ticket-system/` уже существует и служит источником контракта.

## Контекст

В `apps/web/public/ticket-system/` есть работающий статический прототип UI (React UMD, без сборки), который уже реализует полный клиент к REST API (`app/api.js`) и его in-browser мок (`app/mock-api.js`). README прототипа (`apps/web/public/ticket-system/README.md`) документирует ожидаемый контракт — он частично расходится с таблицей эндпоинтов в `TASKS.md`:

| | TASKS.md | Прототип (`api.js`/README) |
|---|---|---|
| Обновление тикета | `PUT /tickets/:id` | `PATCH /tickets/:id` |
| Классификация | `POST /tickets/:id/auto-classify` | `POST /tickets/:id/classify` |
| Конверт ответа | обычный JSON | `{ "data": ... }` / `{ "error": { "message": "…" } }` |

**Решение:** контракт прототипа — основной (фронт должен заработать простым переключением `mock: false` в `app/config.js`). Для соответствия TASKS.md добавляем `PUT` и `/auto-classify` как алиасы тех же хендлеров.

`packages/contracts` (см. `docs/superpowers/specs/2026-07-12-turborepo-scaffold-design.md`) был заранее подготовлен с зависимостью на `zod` и пометкой «наполняется схемами в следующих задачах» — эта задача его наполняет.

Аутентификация в TASKS.md не описана, но задача явно требует тестового пользователя `admin@ignore.com` / `123` — значит нужен реальный логин с обычным контролем доступа к `/tickets/*`, независимо от фронтенд-прототипа (там логин — чисто визуальный gate, не относится к реальному бэкенду).

## Архитектура

```
apps/api/src/
├── main.ts                     # bootstrap, CORS, ValidationPipe, ExceptionFilter (глобально)
├── app.module.ts                # импортирует AuthModule, TicketsModule; HealthController остаётся как есть
├── health.controller.ts         # без изменений — НЕ оборачивается в { data }
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts       # POST /auth/login
│   ├── auth.service.ts          # in-memory один юзер, bcrypt-хэш пароля при старте
│   └── jwt-auth.guard.ts        # CanActivate: проверяет Authorization: Bearer <jwt>
├── tickets/
│   ├── tickets.module.ts
│   ├── tickets.controller.ts    # CRUD + /import + /classify (+ алиасы PUT, /auto-classify)
│   ├── tickets.service.ts       # бизнес-правила (resolved_at, override, auto_classify флаг на create)
│   ├── tickets.repository.ts    # in-memory Map<string, Ticket>, автоинкремент number
│   ├── import/
│   │   ├── csv-parser.service.ts
│   │   ├── json-parser.service.ts
│   │   ├── xml-parser.service.ts
│   │   └── import.service.ts    # оркестрирует: детект формата → парсер → валидация построчно → summary
│   └── classification/
│       └── classification.service.ts   # ключевые слова из TASKS.md, confidence, reasoning, keywords, Logger
└── common/
    ├── zod-validation.pipe.ts   # валидирует body/query по Zod-схеме из @repo/contracts
    ├── envelope.interceptor.ts  # { data: ... }, точечно на Tickets/Auth контроллерах
    └── http-exception.filter.ts # → { error: { message } }, глобальный

packages/contracts/src/
├── index.ts                     # ре-экспорт всего
├── enums.ts                     # Category, Priority, Status, Source, DeviceType
├── ticket.ts                     # TicketSchema, CreateTicketInputSchema, UpdateTicketInputSchema
├── classification.ts             # ClassificationResultSchema
├── import.ts                     # ImportSummarySchema, ImportErrorSchema
└── auth.ts                       # LoginInputSchema, LoginResponseSchema
```

**Почему без passport-jwt:** `@nestjs/jwt` даёт `sign`/`verify`, guard пишется вручную в ~20 строк — на один статичный тестовый аккаунт полноценная passport-стратегия избыточна.

**Почему Zod, а не class-validator:** `@repo/contracts` уже зависит от zod и задуман как общее место схем для api и (в перспективе) web — соответствует уже принятому в скаффолде решению, не вводит второй способ валидации в монорепо.

## Данные и хранилище

`TicketsRepository` — обёртка над `Map<string, Ticket>`, пустая при старте (кроме `admin@ignore.com`, который живёт в `AuthService`, а не в тикетах). Поле `number` — публичный инкрементный номер тикета (как в прототипе, начинается с произвольного значения, например 1000), не часть модели из TASKS.md, но нужен фронту.

`Ticket` в памяти хранит на одно поле больше, чем публичный контракт: `classification_confidence: number | null` — обновляется при `/classify` и при автоклассификации на импорте/создании. Наружу не отдаётся отдельным полем API (публичная модель ticket остаётся как в прототипе/TASKS.md), это внутреннее состояние для соответствия требованию «Store classification confidence»; ручной override делается штатным `PATCH /tickets/:id` (агент правит `category`/`priority` вручную).

## Контракт эндпоинтов

Все ответы, кроме `/health`, оборачиваются в `{ "data": ... }` (успех) или `{ "error": { "message": "…" } }` (ошибка). `DELETE` возвращает 204 без тела.

| Метод | Путь | Тело / query | Ответ |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ data: { token, user: { email } } }`, 401 при неверных данных |
| GET | `/tickets` | `?status=&priority=&category=&assigned_to=&unassigned=&q=` (comma-join для мультивыбора) | `{ data: Ticket[] }` |
| GET | `/tickets/:id` | — | `{ data: Ticket }`, 404 |
| POST | `/tickets` | `CreateTicketInput` (+ опц. `auto_classify: boolean`) | `{ data: Ticket }`, 201 |
| PATCH `/` PUT | `/tickets/:id` | частичный `TicketInput` | `{ data: Ticket }` |
| DELETE | `/tickets/:id` | — | 204 |
| POST | `/tickets/:id/classify` `/` `/auto-classify` | — | `{ data: { category, priority, confidence, reasoning, keywords } }`, ставит новые `category`/`priority` на тикет |
| POST | `/tickets/import` | multipart `file` (.csv/.json/.xml) | `{ data: { imported_count, failed_count, total_count, errors: [{row, message}] } }`, 201 |

Все `/tickets*` и `/auth/login` защищены `JwtAuthGuard`, кроме самого логина. `/health` — без изменений и без обёртки, чтобы не сломать текущую стартовую страницу `apps/web`.

## Классификация

Правила по TASKS.md (не по mock — там другой набор слов):
- **Категории** по ключевым словам в `subject + description`: `account_access` (login/password/2FA), `technical_issue` (bug/error/crash), `billing_question` (payment/invoice/refund), `feature_request` (enhancement/suggestion), `bug_report` (defect + repro steps), иначе `other`.
- **Приоритет**: `urgent` при "can't access"/"critical"/"production down"/"security"; `high` при "important"/"blocking"/"asap"; `low` при "minor"/"cosmetic"/"suggestion"; иначе `medium`.
- `confidence` (0–1) — по числу и силе совпавших сигналов; `reasoning` — человекочитаемое объяснение; `keywords` — список найденных совпадений.
- Каждое решение логируется через `Logger.log` (ticket id, category, priority, confidence).
- При импорте: если строка не содержит явных `category`/`priority`, тикет автоклассифицируется сразу при сохранении (нужно для integration-теста «bulk import + auto-classification»).
- При создании: автоклассификация запускается только если передан `auto_classify: true`.

## Импорт

`ImportService` определяет формат по расширению файла/mimetype, делегирует парсеру, приводит каждую строку к `CreateTicketInput`, валидирует Zod-схемой; ошибка строки → `{ row, message }`. Нумерация `row`: для CSV — номер строки в файле, включая заголовок (первая строка данных → `row: 2`, как в mock); для JSON/XML — порядковый номер элемента, 1-based (первый тикет → `row: 1`). Общий summary считается после обработки всех строк — файл целиком не падает из-за одной битой строки.

- CSV — через `csv-parse` (учитывает кавычки/экранирование, не самодельный `split(',')` как в mock).
- JSON — `JSON.parse`, принимает как массив, так и `{ tickets: [...] }`.
- XML — через `fast-xml-parser`, ожидает `<tickets><ticket>...</ticket></tickets>`.

## Обработка ошибок

Глобальный `HttpExceptionFilter` приводит любое исключение Nest к `{ error: { message } }`: если `exception.getResponse().message` — массив (ValidationPipe), сообщения склеиваются пробелом (как в mock); иначе берётся `exception.message`. Zod-ошибки валидации оборачиваются в `BadRequestException` тем же пайпом.

## Тестирование

Файлы под `apps/api/src/**/*.spec.ts` (unit) и `apps/api/test/**/*.e2e-spec.ts` (e2e/integration), с фикстурами в `apps/api/test/fixtures/`:

- `test_ticket_api` (e2e, ~11) — CRUD + классификация + коды статусов
- `test_ticket_model` (unit, ~9) — Zod-схемы: границы длины полей, enum-валидация, email
- `test_import_csv` / `_json` / `_xml` (unit, 6/5/5) — парсинг + невалидные файлы
- `test_categorization` (unit, ~10) — правила категорий/приоритетов, confidence, keywords
- `test_integration` (e2e, ~5) — полный lifecycle, bulk import + автоклассификация, 20+ конкурентных запросов, комбинированная фильтрация, auth-флоу
- `test_performance` (unit/e2e, ~5) — простые бенчмарки (список из N тикетов, импорт M строк, время classify, конкурентные GET, фильтрация)

Цель: `jest --coverage` (unit) + `test:e2e` > 85% overall.

## Зависимости к добавлению

`apps/api`: `@nestjs/jwt`, `bcryptjs`, `csv-parse`, `fast-xml-parser`, `zod` (через `@repo/contracts`).
`packages/contracts`: без новых зависимостей (zod уже есть).

## Критерии приёмки

1. `pnpm --filter api test` и `pnpm --filter api test:e2e` проходят.
2. `pnpm --filter api test:cov` показывает >85% overall coverage.
3. `POST /auth/login` с `admin@ignore.com`/`123` возвращает токен; без токена `/tickets` → 401.
4. Ручная проверка через curl: CRUD-цикл тикета, импорт валидного csv/json/xml, импорт с ошибками возвращает частичный summary, `/classify` возвращает разумную категорию/приоритет.
5. `GET /health` не ломается (без обёртки, как было).
6. `pnpm --filter api build` и `pnpm --filter api lint` без ошибок.

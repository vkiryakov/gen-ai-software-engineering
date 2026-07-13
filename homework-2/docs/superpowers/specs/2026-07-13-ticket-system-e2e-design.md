# Ticket System UI: подключение к реальному API — Design

**Дата:** 2026-07-13
**Область:** Task 5 из `TASKS.md` — превратить существующий статический прототип (`apps/web/public/ticket-system/`, коммит `666f23a`) в реально работающий фронтенд, подключённый к `apps/api`, и сделать его главной страницей `apps/web`. Бэкенд (`apps/api`) не меняется — см. `docs/superpowers/specs/2026-07-12-ticket-api-design.md`.

## Контекст

Прототип уже полностью реализован: React 18 (UMD) + Babel Standalone, design system "Triage" (`_ds/`), компоненты `Sidebar`/`TicketList`/`TicketDetail`/`TicketFormModal`/`ImportModal`, REST-клиент `app/api.js` под контракт, который 1:1 совпадает с уже работающим `apps/api` (`{ data }`/`{ error: { message } }`, `/tickets`, `/tickets/:id/classify`, `/tickets/import`). Сейчас он:

- обслуживается как статический файл из `public/ticket-system/Ticket System.html`, не связан с роутингом Next.js — на `http://localhost:3000/` до сих пор висит health-check заглушка (`apps/web/app/page.tsx`);
- работает в mock-режиме (`app/config.js`: `mock: true`), с фейковым логином (любой email/пароль проходит, кроме буквального `wrong`).

Бэкенд полностью готов: `POST /auth/login` с единственным пользователем `admin@ignore.com` / `123`, JWT, CORS уже открыт для `http://localhost:3000`.

## Архитектура

```
apps/web/
├── app/
│   └── page.tsx                  # было: health-check; станет: серверная обёртка, печатает
│                                    window.__API_BASE_URL__ и подключает ассеты ticket-system
│                                    через next/script + <link>, рендерит <div id="root">
└── public/ticket-system/
    ├── Ticket System.html        # не трогаем — самостоятельная точка входа остаётся рабочей
    └── app/
        ├── config.js             # default apiBaseUrl берёт window.__API_BASE_URL__, mock: false
        ├── api.js                # + login(email, password); request() отдельно обрабатывает 401
        └── App.jsx                # НОВЫЙ файл — код inline-скрипта из Ticket System.html
                                     (App/LoginScreen/AgentApp/...), вынесен, чтобы им мог
                                     поделиться и статичный html, и Next.js страница
```

`Ticket System.html` вместо инлайн-скрипта подключает `app/App.jsx` тем же `<script type="text/babel" src="...">` — поведение файла не меняется, просто код переезжает в отдельный файл.

## Изменения по файлам

**`app/config.js`** — `DEFAULTS.apiBaseUrl` берёт `window.__API_BASE_URL__` (если задан), иначе прежний плейсхолдер; `DEFAULTS.mock = false`. Значение из `localStorage` по-прежнему имеет приоритет (agent может руками переключить обратно на mock — ничего не убираем).

**`app/api.js`** — добавляется:
```js
async login(email, password) {
  const json = await request('/auth/login', { method: 'POST', body: { email, password } });
  return json.data; // { token, user: { email } }
},
```
без mock-ветки (логин всегда бьёт в реальный бэкенд — иначе демо-проверку пароля "wrong" пришлось бы держать вечно). `request()` при статусе 401 дополнительно кидает `window.TriageConfig.set({ token: '' })`, чтобы протухший токен не завис в localStorage.

**`app/App.jsx`** (новый, = нынешний inline-скрипт из `Ticket System.html`, строки 63–393) — правки внутри:
- `LoginScreen.handleSubmit`: вместо `if (password === 'wrong')` вызывает `window.TriageAPI.login(email, password)`, при успехе кладёт `token` через `TriageConfig.set`, при ошибке показывает `e.message` в `Banner` (реальный текст с бэкенда — "Invalid email or password.").
- `App`: `onLogout` дополнительно чистит токен (`TriageConfig.set({ token: '' })`).
- Всё остальное (`AgentApp`, `TopBar`, `Toast`, layout) — без изменений.

**`apps/web/app/page.tsx`** — серверный компонент (как сейчас), но вместо health-check рендерит клиентскую обёртку:
```tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
// <link> токены дизайн-системы и styles.css из /ticket-system/_ds/...
// инлайн <script>window.__API_BASE_URL__ = "...";</script> — ДО config.js
// next/script, все со strategy="afterInteractive" (Next.js гарантирует порядок
// выполнения скриптов с одинаковой strategy в порядке объявления):
//   react, react-dom, babel standalone, _ds_bundle.js, lucide,
//   app/config.js, constants.js, mock-api.js, api.js,
//   Sidebar.jsx, TicketList.jsx, TicketDetail.jsx, TicketFormModal.jsx, ImportModal.jsx (type="text/babel"),
//   App.jsx (type="text/babel")
// <div id="root" />
```
Значение `API_URL` печатается через `JSON.stringify`, а не интерполируется в шаблонную строку без экранирования — иначе это XSS-вектор через переменную окружения (маловероятный, но дешёвый в исправлении).

Старый health-check контент (пинг `/health`, indicator ok/unavailable) — удаляется из `page.tsx`; сам факт того, что бэкенд жив, теперь виден по тому, что список тикетов реально грузится.

## Известное ограничение

Очередь "Assigned to me" в `Sidebar` фильтрует тикеты по жёстко зашитому id `'priya'` (`TRIAGE_META.agents`) — у бэкенда нет модели агентов, `assigned_to` это просто строка. Очередь останется рабочей только для тикетов, у которых `assigned_to` руками выставлен в `'priya'`. Полноценную систему агентов/назначений не строим — вне объёма ДЗ. Отмечаем это в README прототипа.

## Проверка

Ручной прогон (нет тестовой обвязки — это статический UI без сборки, есть только браузерная проверка):
1. `pnpm dev` в `apps/api` и `apps/web` параллельно.
2. Открыть `http://localhost:3000/` — должен появиться экран логина Triage (не health-check).
3. Залогиниться `admin@ignore.com` / `123` → успех → список тикетов (изначально пустой — бэкенд стартует с пустым хранилищем).
4. Создать тикет через "New ticket", отредактировать, вызвать Classify, импортировать `test/fixtures/tickets-valid.csv`, удалить один тикет — каждое действие должно бить в реальный API (Network-таб) и не падать в mock.
5. Неверный пароль → баннер с реальным текстом ошибки от `/auth/login`.
6. Logout → возврат на экран логина, токен не должен переживать логаут (проверить localStorage).

## Вне объёма

- Не переписываем UI-компоненты на TSX — Approach A из брейнсторминга (обёртка вместо переписывания), см. обсуждение в чате.
- Не строим систему агентов/пользователей.
- Не убираем `mock-api.js`/переключатель mock — оставляем как аварийный fallback без демо-контента по умолчанию.

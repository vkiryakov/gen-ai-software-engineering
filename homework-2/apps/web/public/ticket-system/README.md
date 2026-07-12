# Triage — Ticket System UI

A single-page agent workspace for the Triage support-ticket API: list/filter
tickets, create and edit them with validated forms, inspect full ticket
detail (incl. metadata), bulk-import from CSV/JSON/XML, and trigger
auto-classification. Built with React 18 (UMD) + Babel Standalone against the
**Triage design system** — no build step required.

## Running it

This is a static site (no bundler). Any of these work:

1. **Via the Next.js dev server** (recommended in this monorepo) — with
   `pnpm dev` running, everything under `apps/web/public/` is served as-is.
   Open `http://localhost:3000/ticket-system/Ticket%20System.html`.
2. **Open directly** — double-click `Ticket System.html`, or open it via
   `file://` in a browser. Good enough for a first look, but `fetch()` to a
   real API may be blocked by the browser under `file://` in some
   configurations.
3. **Serve it standalone** — from this folder:
   ```
   npx serve .
   # or: python3 -m http.server 8080
   ```

Login accepts any email/password (front-end only demo gate — type the
password `wrong` to see the error state). There's no real session; it's a
UI shell in front of the ticket API.

## Connecting the real API (Tasks 1–2)

The UI ships in **mock mode** by default, so it's fully clickable with zero
backend. To point it at your real API, edit the defaults in `app/config.js`:

```js
const DEFAULTS = {
  apiBaseUrl: 'https://api.yourteam.dev/v1',
  token: '',        // sent as Authorization: Bearer <token>
  mock: false,       // flip off once the backend is live
};
```

There's no in-app settings screen — this is a code-level switch so the mock
can't accidentally ship pointed at a real backend. Everything else in the UI
is unchanged either way; only `app/api.js` talks to the network.

**CORS**: the browser calls your API directly from this page's origin, so
the API must send `Access-Control-Allow-Origin` for that origin (or `*`) plus
allow the `Authorization` header.

### Expected REST contract

All requests (except `/tickets/import`) send/receive JSON and expect
`Authorization: Bearer <token>` when a token is configured.

| Method | Path | Notes |
|---|---|---|
| GET | `/tickets?status=&priority=&category=&assigned_to=&unassigned=&q=` | Filters are comma-joined for multi-select (e.g. `status=new,in_progress`). Returns `{ "data": Ticket[] }`. |
| GET | `/tickets/:id` | Returns `{ "data": Ticket }`. 404 if missing. |
| POST | `/tickets` | Body: `TicketInput`. Returns `{ "data": Ticket }`, 201. |
| PATCH | `/tickets/:id` | Body: partial `TicketInput` (also accepts `status`/`assigned_to`/`resolved_at` patches from quick-edit selects). Returns `{ "data": Ticket }`. |
| DELETE | `/tickets/:id` | 204 on success. |
| POST | `/tickets/:id/classify` | No body. Returns `{ "data": { category, priority, confidence, reasoning } }`. `confidence` is 0–1. |
| POST | `/tickets/import` | `multipart/form-data`, field `file` (`.csv`/`.json`/`.xml`). Returns `{ "data": { imported_count, failed_count, errors: [{ row, message }] } }`. |

**Ticket shape** (matches the schema this UI was built against):

```json
{
  "id": "uuid",
  "number": 4790,
  "customer_id": "string",
  "customer_email": "email",
  "customer_name": "string",
  "subject": "string (1-200 chars)",
  "description": "string (10-2000 chars)",
  "category": "account_access | technical_issue | billing_question | feature_request | bug_report | other",
  "priority": "urgent | high | medium | low",
  "status": "new | in_progress | waiting_customer | resolved | closed",
  "created_at": "datetime",
  "updated_at": "datetime",
  "resolved_at": "datetime | null",
  "assigned_to": "string | null",
  "tags": ["array"],
  "metadata": {
    "source": "web_form | email | api | chat | phone",
    "browser": "string",
    "device_type": "desktop | mobile | tablet"
  }
}
```

**Errors**: any non-2xx should return `{ "error": { "message": "…" } }` —
the UI surfaces `error.message` directly in banners/toasts. A network
failure (unreachable host, CORS block) is caught and shown as a generic
"check the API base URL" error.

## What's mocked vs. real

`app/mock-api.js` implements the exact same function signatures as
`app/api.js`'s real client (`listTickets`, `getTicket`, `createTicket`,
`updateTicket`, `deleteTicket`, `classifyTicket`, `importTickets`), seeded
with a handful of realistic tickets and simulated network delay. Classify
uses a small keyword heuristic (billing/refund → billing_question,
password/login → account_access, etc.) to fabricate a plausible
category/priority/confidence/reasoning — replace with your model's real
output once the backend is live. Nothing in the UI layer changes when you
flip the mock switch off; only `app/api.js` talks to the network.

## Project structure

```
Ticket System.html      Entry point — login screen + app shell
app/
  config.js             API base URL / token / mock switch (persisted)
  constants.js           Enums, labels, reference data (NOT ticket records)
  api.js                 Real REST client
  mock-api.js            In-browser mock backend (same contract as api.js)
  Sidebar.jsx            Queue navigation (drawer on mobile)
  TicketList.jsx         List + search + status/priority/category filters
  TicketDetail.jsx       Detail view, quick-edit fields, classification panel
  TicketFormModal.jsx    Create/edit form with client-side validation
  ImportModal.jsx        CSV/JSON/XML bulk import
_ds/                     Triage design system bundle (components + tokens)
```

## Responsive behavior

Below ~860px width: the sidebar becomes a slide-over drawer (hamburger
button in the list toolbar), and the ticket list and detail panes stack —
selecting a ticket shows detail full-screen with a back button instead of
a fixed three-pane layout.

## Known limitations

- Login is a front-end-only gate, not real auth.
- The mock backend resets on page reload (in-memory only).
- CSV/XML import parsing in the mock is intentionally simple (flat
  columns/elements matching `TicketInput` field names) — the real backend's
  parser can be as sophisticated as needed since the UI only sees the final
  `{ imported_count, failed_count, errors }` summary.

## Provenance

This is a static prototype imported from a Claude Design project
(design-system UI kit "Triage"), kept as-is (mock mode, no build step) per
`homework-2/TASKS.md`'s note that ticket CRUD / import / auto-classification
are upcoming stages. It is not wired into the Next.js app (`apps/web/app/`)
— it's served as a static asset from `public/ticket-system/` for reference
while the real API (`apps/api`) and app pages are built out.

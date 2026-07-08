## ✅ Summary

NestJS 11 service exposing a transactions ledger with derived account analytics. Data is held in-process (no database) — this is a pedagogical / playground project, not something to deploy.

**Stack:** NestJS 11, TypeScript (strict), pnpm, `class-validator` / `class-transformer`, `@nestjs/swagger`, `@nestjs/throttler`, `csv-stringify`, Jest + supertest.

**Endpoints implemented:**

| Method | Path | Purpose |
|---|---|---|
| POST | `/transactions` | Create a transaction (`deposit` / `withdrawal` / `transfer`) |
| GET | `/transactions` | List, optionally filtered by `accountId`, `type`, `from`, `to` |
| GET | `/transactions/export` | Stream all transactions as RFC 4180 CSV |
| GET | `/transactions/:id` | Look up a single transaction by id (404 if unknown) |
| GET | `/accounts/:id/balance` | Current balance per currency (only `completed` transactions) |
| GET | `/accounts/:id/summary` | Per-currency deposit/withdrawal totals, count, most recent date |
| GET | `/accounts/:id/interest` | Simple interest `I = P × r × t` per currency, given `rate` and `days` |

**Key features & design decisions:**
- **Domain-based layout:** code lives under `src/domains/<domain>/` (accounts, transactions); each domain is its own NestJS module — not grouped by `controllers/` / `services/` / `dtos/`.
- **Repository pattern:** `TransactionsRepository` owns the in-memory array; the service never touches storage directly. Swapping to a real DB is a one-class change.
- **Transactions are the single source of truth:** there is no `Account` entity. Balance / summary / interest are replayed from the transaction log on each request (`AccountsService` depends on `TransactionsService`). Cheap to keep consistent, expensive at scale — acceptable trade-off for homework.
- **Type-aware account validation on create:** `deposit` needs `toAccount`, `withdrawal` needs `fromAccount`, `transfer` needs both and they must differ.
- **ISO 4217 currency whitelist;** account-number format `ACC-XXXXX` (5 alphanumerics, uppercased on input).
- **Per-currency aggregation, never summed across currencies.** Money is rounded to 2 decimals at the boundary to avoid IEEE 754 drift.
- **Status-aware aggregation:** only `completed` transactions affect balances and money totals; `pending` / `failed` still count toward `transactionCount` and `mostRecentTransactionDate` because users care that activity *happened*.
- **Inclusive date-range filtering:** bare `YYYY-MM-DD` expands to a full UTC day; full ISO 8601 strings are used as-is.
- **Strict input validation at the edge:** global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`, and `stopAtFirstError`, plus a custom `validationExceptionFactory` that shapes the 400 response.
- **Rate limiting:** 100 requests/min per IP (global `ThrottlerGuard`).
- **Swagger/OpenAPI** auto-generated at `/docs`.
- **Errors as HTTP exceptions from services:** services throw `BadRequestException` / `NotFoundException`; controllers stay thin.

**Tests:**
- Unit (`*.spec.ts` next to source): `transactions.service`, `transactions.repository`, `accounts.service`.
- E2E (`test/transactions.e2e-spec.ts`, supertest): full lifecycle across every endpoint, including validation errors and 404s.
- Run with: `pnpm test`, `pnpm run test:e2e`, `pnpm run test:cov`.

**Documentation:**
- `homework-1/README.md` — overview, stack, endpoints, architecture notes.
- `homework-1/HOWTORUN.md` — step-by-step setup, run, test, and troubleshooting guide.
- `homework-1/AGENTS.md` — project conventions (mandatory JSDoc on service methods, named return types, step-comments for major phases).
- `homework-1/docs/screenshots/` — Swagger screenshots for all 10 scenarios (happy paths + 400 / 404).
- `homework-1/demo/sample-requests.http` + `demo/run.sh` / `run.bat` — ready-to-fire requests for a quick smoke test.

---

## 🛠️ AI tools used

**Tool:** Claude Code (Opus 4.7) as the primary assistant across the whole cycle.

**Workflow:**
1. **Scaffold** — `nest new` by hand, then Claude generated domain modules / services / controllers from an explicit description of the domain model (accounts, transactions, types, statuses).
2. **Custom `nestjs-best-practices` skill** (`homework-1/.agents/skills/nestjs-best-practices/`) — a ~35-rule pack covering API design, architecture, DI, error handling, security, testing, perf, microservices, and devops. Claude loaded it as context for every generation. This kept architecture consistent and prevented style drift between modules.
3. **Project-level `AGENTS.md`** — overrides the default "no comments" stance for this pedagogical codebase: mandatory JSDoc on every service method (public **and** private), step-comments for major phases, named `interface` / `type` for every non-primitive return. Claude obeyed this consistently across iterations.
4. **DTOs + validation** — generated from `class-validator` decorators, then I hand-tuned edge cases (the type-aware account validation for `transfer` in particular).
5. **Tests** — unit tests generated per-service with explicit prompting for edge cases (statuses, currencies, date ranges); e2e covers full happy path + 400 / 404. I checked coverage manually via `pnpm run test:cov`.
6. **Documentation** — README / HOWTORUN drafted with Claude, then I re-read and edited by hand; every code-line reference I verified manually.
7. **Screenshots** — captured myself through the Swagger UI for all 10 scenarios.

**Verified manually:**
- Started the server and hit every endpoint via Swagger + curl (see `homework-1/docs/screenshots/`).
- `pnpm test` (unit) and `pnpm run test:e2e` — all green.
- `pnpm run lint` — clean.
- Confirmed the in-memory store is wiped on restart (explicitly called out as a limitation in HOWTORUN).
- Confirmed rate limiting (429 after >100 req/min from the same IP).
- Confirmed CSV export opens cleanly in Excel / Numbers (RFC 4180, includes the header row).
- Confirmed 400 responses for malformed body / unknown fields / wrong currency / wrong account format.
- The architectural choice "account = projection of transactions" — manually sanity-checked that `summary` and `balance` stay consistent after a mixed series of transactions with different statuses.

d
# 🏦 Homework 1: Banking Transactions API

**Student Name:** Vladimir Kiryakov
**Date Submitted:** 12.05.2026
**AI Tools Used:** Claude Code

## 📋 Project Overview

A small NestJS 11 service exposing a transactions ledger and derived account analytics. Data lives in-process — no database — so this is meant as a teaching/playground project, not something to deploy.

This project was completed as part of the AI-Assisted Development course.

---

A small NestJS 11 service exposing a transactions ledger and derived account analytics. Data lives in-process — no database — so this is meant as a teaching/playground project, not something to deploy.

## Stack

- NestJS 11 + TypeScript (strict)
- pnpm
- `class-validator` / `class-transformer` for DTO validation
- `@nestjs/swagger` for OpenAPI at `/docs`
- `@nestjs/throttler` for per-IP rate limiting
- `csv-stringify` for CSV export
- Jest (unit + supertest e2e)

## Running

```bash
pnpm install
pnpm run start:dev        # http://localhost:3000, Swagger at /docs
pnpm test                 # unit
pnpm run test:e2e         # e2e
pnpm run lint
```

## Endpoints

**Transactions** ([transactions.controller.ts](src/domains/transactions/transactions.controller.ts))

| Method | Path                    | Purpose                                                                 |
| ------ | ----------------------- | ----------------------------------------------------------------------- |
| POST   | `/transactions`         | Create a transaction (`deposit` / `withdrawal` / `transfer`).           |
| GET    | `/transactions`         | List, optionally filtered by `accountId`, `type`, `from`, `to`.         |
| GET    | `/transactions/export`  | Stream all transactions as RFC 4180 CSV.                                |
| GET    | `/transactions/:id`     | Look up one transaction by id; 404 if unknown.                          |

**Accounts** ([accounts.controller.ts](src/domains/accounts/accounts.controller.ts))

| Method | Path                          | Purpose                                                                          |
| ------ | ----------------------------- | -------------------------------------------------------------------------------- |
| GET    | `/accounts/:id/balance`       | Current balance per currency, derived from `completed` transactions only.        |
| GET    | `/accounts/:id/summary`       | Per-currency deposit/withdrawal totals, transaction count, most recent date.     |
| GET    | `/accounts/:id/interest`      | Simple interest `I = P × r × t` per currency, given annual `rate` and `days`.    |

## Features implemented

- Transaction CRUD-light: create, get-by-id, list, account-filter, CSV export.
- Inclusive date range filtering on list: bare `YYYY-MM-DD` expands to full UTC day; full ISO 8601 used as-is ([transactions.service.ts:55-73](src/domains/transactions/transactions.service.ts#L55-L73), [common/utils.ts](src/common/utils.ts)).
- Type-aware account validation on create: `deposit` needs `toAccount`, `withdrawal` needs `fromAccount`, `transfer` needs both and they must differ ([transactions.service.ts:138-167](src/domains/transactions/transactions.service.ts#L138-L167)).
- ISO 4217 currency check against a whitelist ([common/iso-4217-currencies.ts](src/common/iso-4217-currencies.ts)).
- Account number format `ACC-XXXXX` (5 alphanumerics, uppercased on input).
- Per-currency balance / summary / simple-interest computed on demand from the transaction log ([accounts.service.ts](src/domains/accounts/accounts.service.ts)).
- Global rate limiting: 100 requests/min per IP ([app.module.ts](src/app.module.ts)).
- Swagger/OpenAPI auto-generated at `/docs`.

## Architecture decisions

- **Domains, not types.** Code is grouped under `src/domains/<domain>/` (accounts, transactions) rather than `controllers/`, `services/`, `dtos/`. Each domain is its own NestJS module.
- **Repository pattern with an in-memory store.** `TransactionsRepository` ([transactions.repository.ts](src/domains/transactions/transactions.repository.ts)) owns the array; the service never touches storage directly. Swapping to a real DB would replace this one class.
- **Transactions are the single source of truth.** There is no `Account` entity — balances, summaries, and interest are all replayed from `TransactionsRepository` on each request. `AccountsService` depends on `TransactionsService` ([accounts.service.ts:46](src/domains/accounts/accounts.service.ts#L46)). Trade-off: cheap to keep consistent, expensive at scale — acceptable for a homework project.
- **Status-aware aggregation.** Only `completed` transactions affect balances and money totals; `pending` and `failed` still count toward `transactionCount` and `mostRecentTransactionDate` because users care that activity happened ([accounts.service.ts:89-123](src/domains/accounts/accounts.service.ts#L89-L123)).
- **Per-currency, never summed across currencies.** Cross-currency arithmetic isn't meaningful without rates, so every monetary output is grouped by ISO 4217 code. Balances and interest are rounded to 2 decimal places at the boundary to dodge IEEE 754 drift.
- **Strict input validation at the edge.** `main.ts` installs a global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`, and `stopAtFirstError`; a custom `validationExceptionFactory` shapes the 400 response ([main.ts](src/main.ts), [common/validation-exception.factory.ts](src/common/validation-exception.factory.ts)).
- **Errors as HTTP exceptions from services.** Services throw `BadRequestException` / `NotFoundException` directly; controllers stay thin. Per the [nestjs-best-practices skill](../.agents/skills/nestjs-best-practices/SKILL.md).
- **Named return types on service methods.** No inline anonymous object shapes on service return signatures — every non-primitive return has a named `interface` or `type` ([AGENTS.md](AGENTS.md#service-return-types)).
- **JSDoc on every service method.** This is a pedagogical codebase; service files document summary, `@param`, `@returns`, and `@throws` for both public and private methods ([AGENTS.md](AGENTS.md#service-code-documentation)).

## Layout

```text
src/
  main.ts                       # bootstrap + global pipe + Swagger
  app.module.ts                 # composes domain modules + global throttler guard
  common/                       # cross-cutting: date parsing, currency list, exception factory
  domains/
    transactions/
      transactions.controller.ts
      transactions.service.ts
      transactions.repository.ts
      transaction.types.ts
      dto/
    accounts/
      accounts.controller.ts
      accounts.service.ts        # derives balance/summary/interest from transactions
      dto/
test/                            # e2e (supertest, separate Jest config)
docs/                            # screenshots of each endpoint
```

Unit tests live next to source as `*.spec.ts`; e2e tests live in `test/`.

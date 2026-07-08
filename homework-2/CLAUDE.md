# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository context

This directory (`homework-2/`) is a self-contained pnpm workspace inside a larger git repo (`gen-ai-software-engineering/`) that holds separate homework folders. Run all commands from `homework-2/`, not the git root. `TASKS.md` is the assignment spec (Intelligent Customer Support System).

## Commands

Requires Node ≥ 20 and pnpm 10 (`corepack enable`).

```bash
pnpm install         # install all workspaces
pnpm dev             # api at http://localhost:3001/api + web at http://localhost:5173
pnpm build           # build all workspaces in dependency order
pnpm test            # all test suites (via turbo)
pnpm lint            # eslint across workspaces
pnpm type-check      # tsc --noEmit across workspaces
```

Single workspace / single test:

```bash
pnpm --filter @repo/api test                              # api tests only (Jest, *.spec.ts under src/)
pnpm --filter @repo/api test -- tickets.service           # one spec file by name pattern
pnpm --filter @repo/api test:cov                          # coverage → apps/api/coverage/
pnpm --filter @repo/contracts build                       # rebuild shared contracts
```

`apps/api` runs Jest as two projects (see `apps/api/jest.config.js`): `unit` (`rootDir: src`, `*.spec.ts` colocated with the code) and `e2e` (`rootDir: .`, the ticket-api/model/integration/performance suites under `test/`). `pnpm --filter @repo/api test` runs both projects; `test:cov` additionally enforces a coverage threshold (85% lines/statements/functions, 80% branches) and fails the command if actual coverage drops below it.

**Important:** every Turbo task `dependsOn: ["^build"]`, so root-level `pnpm test`/`lint`/`type-check` build `@repo/contracts` first automatically. If you instead run a workspace script directly with `--filter`, that dependency build is skipped — build `@repo/contracts` first or imports of `@repo/contracts` will resolve against a stale/missing `dist/`.

## Architecture

Turborepo monorepo with two apps sharing one contracts package:

- **`packages/contracts` (`@repo/contracts`)** — the single source of truth for the domain model. Zod schemas (`ticket.ts`, `enums.ts`, `classification.ts`, `import.ts`) with TypeScript types inferred via `z.infer`. Built with tsup to dual ESM/CJS in `dist/`; consumers import the built output, not source — after editing schemas, rebuild (or run `pnpm --filter @repo/contracts dev` for watch mode). A schema change surfaces as a compile error in both apps.
- **`apps/api` (`@repo/api`)** — NestJS REST API, port 3001, global prefix `/api`. Request flow: `TicketsController` validates bodies/queries with `ZodValidationPipe` (in `src/common/`, wraps contracts schemas, maps `ZodError` → 400 with per-field errors) → `TicketsService` (in-memory `Map` store, deliberately swappable for a real repository without touching the controller) → `ClassificationService` (rule-based keyword matcher: ordered category/priority rules, first matching rule wins, confidence scales with match count capped at 0.95, defaults to `other`/`medium`).
- **`apps/api/src/import/`** — three parser services (`CsvParserService`, `JsonParserService`, `XmlParserService`) that turn a CSV/JSON/XML file body into an array of loosely-typed records for `POST /tickets/import`; all file-level failures (empty content, malformed syntax, wrong shape) throw the shared `ImportParseError`, which the controller maps to `400`. The multipart endpoint resolves the format via `?format=` override → file extension → MIME type, in that precedence order.
- **`apps/web` (`@repo/web`)** — React 19 + Vite SPA, port 5173. `src/api/client.ts` is a thin typed fetch wrapper over the API using contracts types. The Vite dev server proxies `/api` → `localhost:3001`, so there's no CORS locally; `VITE_API_URL` overrides the base URL. Routing is handled by react-router with two pages: `/` (`TicketsPage`, the ticket list/create/filter UI) and `/import` (`ImportPage`, the drag-and-drop CSV/JSON/XML uploader that renders the returned `ImportSummary`).
- **`packages/eslint-config`** — shared ESLint flat configs: `base.js`, `react.js` (used by web), `nest.js` (used by api).

Auto-classification runs in two places: on creation when the payload sets `auto_classify: true` (explicit `category`/`priority` in the payload win over classified values), and on demand via `POST /tickets/:id/auto-classify`, which persists the derived category/priority and returns the full `ClassificationResult` (confidence, reasoning, keywords found).

Conventions: API JSON fields are snake_case (matching the contracts schemas); all contracts schemas use `.strict()`, so unknown fields are rejected — extending a payload means editing the schema in `packages/contracts` first.

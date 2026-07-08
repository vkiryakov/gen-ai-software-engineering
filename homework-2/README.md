# 🎧 Support Tickets — Turborepo Monorepo

A [Turborepo](https://turbo.build/repo) monorepo for the Intelligent Customer Support System:
a **React** frontend and a **NestJS** backend that share a single, type-safe **contracts**
package (Zod schemas → inferred TypeScript types) used for validation on the server and
typing on the client.

## Architecture

```mermaid
flowchart LR
    subgraph web["apps/web — React + Vite + react-router"]
        UI[Tickets page]
        IMP[Import page]
        Client[typed API client]
    end
    subgraph api["apps/api — NestJS"]
        Ctrl[TicketsController]
        subgraph import["ImportModule"]
            CSV[CsvParser]
            JSONP[JsonParser]
            XML[XmlParser]
        end
        Svc[TicketsService<br/>in-memory Map]
        Cls[ClassificationService<br/>rule-based + Logger]
    end
    contracts["packages/contracts<br/>Zod schemas + types"]

    UI --> Client
    IMP --> Client
    Client -->|"HTTP /api/tickets"| Ctrl
    Ctrl --> CSV & JSONP & XML
    Ctrl --> Svc
    Svc --> Cls
    contracts -. "types" .-> Client
    contracts -. "validation + types" .-> Ctrl
```

The `@repo/contracts` package is the single source of truth. The API validates every request
body against its Zod schemas; the web app imports the inferred types so a change to the shape
of a ticket surfaces as a compile error on **both** sides.

## Workspace layout

```
homework-2/
├── apps/
│   ├── api/          # NestJS REST API (tickets CRUD + auto-classification)
│   └── web/          # React + Vite single-page app
├── packages/
│   ├── contracts/    # Zod schemas + inferred types (shared domain model)
│   └── eslint-config/# Shared ESLint flat configs (base / react / nest)
├── turbo.json        # Turborepo task pipeline
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Prerequisites

- Node.js ≥ 20
- [pnpm](https://pnpm.io) 10 (`corepack enable` will provide it)

## Getting started

```bash
pnpm install        # install all workspaces
pnpm build          # build contracts → api & web (respects the dependency graph)
pnpm dev            # run api (http://localhost:3001/api) + web (http://localhost:5173)
```

`pnpm dev` starts both apps in parallel via Turborepo. The Vite dev server proxies `/api`
to the NestJS backend, so there is no CORS to configure locally.

## Common commands

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps in watch mode |
| `pnpm build` | Build every workspace (topological order) |
| `pnpm test` | Run all test suites |
| `pnpm lint` | Lint every workspace |
| `pnpm type-check` | Type-check every workspace |
| `pnpm --filter @repo/api test:cov` | API coverage report — enforced 85% threshold |

Target a single workspace with `--filter`, e.g. `pnpm --filter @repo/api dev`.

## API

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe |
| `POST` | `/tickets` | Create a ticket (`auto_classify: true` to classify on create) |
| `POST` | `/tickets/import` | Bulk import a CSV/JSON/XML file (multipart `file` field; `?format=` override, `?auto_classify=true`) |
| `GET` | `/tickets` | List tickets (filter by `category`, `priority`, `status`, `assigned_to`, `search`) |
| `GET` | `/tickets/:id` | Fetch one ticket |
| `PUT` | `/tickets/:id` | Update a ticket |
| `DELETE` | `/tickets/:id` | Delete a ticket (`204`) |
| `POST` | `/tickets/:id/auto-classify` | Run keyword classification and persist the result |

Tickets are held in memory (`Map`) for now — swap `TicketsService` for a real repository
(Prisma/TypeORM) without touching the controller or the contracts.

## Sample data

Ready-made CSV/JSON/XML fixtures (50/20/30 valid tickets plus deliberately invalid files) live
under [`apps/api/test/fixtures/`](apps/api/test/fixtures/) — hand them to `POST /tickets/import`
to try the bulk import flow. Regenerate them with:

```bash
node apps/api/scripts/generate-fixtures.mjs
```

## Adding to the shared contract

Edit the Zod schemas in [`packages/contracts/src`](packages/contracts/src), then rebuild:

```bash
pnpm --filter @repo/contracts build
```

Both apps pick up the new types automatically (run `pnpm --filter @repo/contracts dev` to
rebuild on change while developing).

## Documentation

- [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) — endpoint-level request/response reference for API consumers.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — components, data flow diagrams, design decisions, security and performance considerations.
- [`docs/TESTING_GUIDE.md`](docs/TESTING_GUIDE.md) — test suite layout, coverage strategy, and how to run/extend the tests.
- [`docs/superpowers/specs`](docs/superpowers/specs) and [`docs/superpowers/plans`](docs/superpowers/plans) — the assignment spec and implementation plan this codebase was built from.

# How to run

Step-by-step instructions for running the `homework-1` NestJS service locally.

All commands run from inside `homework-1/`.

## 1. Prerequisites

- **Node.js** ≥ 20 (project is developed on Node 22).
- **pnpm** ≥ 9 — this project uses `pnpm-lock.yaml`; do not install with npm or yarn.

  ```bash
  node -v
  pnpm -v
  ```

  If pnpm is missing:

  ```bash
  npm install -g pnpm
  ```

## 2. Install dependencies

```bash
pnpm install
```

This reads `pnpm-lock.yaml` and populates `node_modules/`.

## 3. Start the server

Watch mode (recommended during development — reloads on file change):

```bash
pnpm run start:dev
```

One-off start (no watcher):

```bash
pnpm run start
```

Production-style start (requires a prior build):

```bash
pnpm run build
pnpm run start:prod
```

The server listens on **port 3000** by default. To pick a different port:

```bash
PORT=4000 pnpm run start:dev
```

You should see Nest's startup banner ending with:

```
[NestApplication] Nest application successfully started
```

## 4. Verify it's running

- **Swagger UI** — interactive API docs and try-it-out:
  → <http://localhost:3000/docs>

- **Quick smoke test** — create a deposit, then read it back:

  ```bash
  curl -X POST http://localhost:3000/transactions \
    -H 'Content-Type: application/json' \
    -d '{
      "toAccount": "ACC-00001",
      "amount": 100.50,
      "currency": "USD",
      "type": "deposit"
    }'

  curl http://localhost:3000/accounts/ACC-00001/balance
  ```

  The first call returns the created transaction (with a generated `id` and `timestamp`); the second returns `{ accountId: "ACC-00001", balances: [{ currency: "USD", amount: 100.5 }] }`.

> **Note:** the data store is in-memory — restarting the server wipes every transaction.

## 5. Run the tests

Unit tests (Jest, files under `src/**/*.spec.ts`):

```bash
pnpm test                 # all unit tests
pnpm run test:watch       # watch mode
pnpm run test:cov         # with coverage report → coverage/
```

End-to-end tests (Jest + supertest, files under `test/`):

```bash
pnpm run test:e2e
```

Run a single test file or filter by name:

```bash
pnpm test -- src/domains/transactions/transactions.service.spec.ts
pnpm test -- -t "creates a deposit"
```

## 6. Lint & format

```bash
pnpm run lint             # eslint --fix on src, apps, libs, test
pnpm run format           # prettier --write on src and test
```

## 7. Stop the server

In the terminal running `start:dev`, press **Ctrl+C**.

## Troubleshooting

- **`EADDRINUSE: address already in use :::3000`** — another process is on port 3000. Either stop it (`lsof -i :3000` to find the PID) or start on a different port: `PORT=4000 pnpm run start:dev`.
- **`Cannot find module …` after pulling** — dependencies drifted; re-run `pnpm install`.
- **`429 ThrottlerException: Too Many Requests`** — the global throttler is set to 100 requests/min per IP ([app.module.ts](src/app.module.ts)). Wait a minute and retry, or lower the request rate.
- **Validation errors with no obvious cause** — `ValidationPipe` runs with `forbidNonWhitelisted: true`, so unknown fields in the request body are rejected. Check field names against the DTOs in [src/domains/*/dto/](src/domains/).

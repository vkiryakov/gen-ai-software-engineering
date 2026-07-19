# Homework 6 — Transaction Processing Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a file-based, 4-stage transaction processing pipeline (validate → fraud → compliance → settlement) with a reporting summary, a Vite/React dashboard, a custom MCP server, two Claude Code skills, a coverage-gate hook, tests (≥80% gate / ≥90% target), and full docs — all self-contained under `homework-6/`.

**Architecture:** Pure per-stage handler functions are wrapped by a generic file-bus runner. `shared/output/` acts as a message bus keyed by each envelope's `target_stage`; terminal outcomes land in `shared/results/`. The orchestrator seeds `input/` from `sample-transactions.json`, runs stages in order, and writes `results/summary.json`. A thin Express bridge lets the React SPA trigger runs and read results.

**Tech Stack:** Node 24 + TypeScript, `tsx` (run TS directly), `vitest` + `@vitest/coverage-v8`, `decimal.js`, `zod`, `@modelcontextprotocol/sdk`, Express, Vite + React.

## Global Constraints

- Monetary values: `decimal.js` only, never `float`/`number` arithmetic. Config `Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })`.
- Currency codes validated against an ISO 4217 allow-set.
- Audit log lines carry: ISO 8601 timestamp, stage name, transaction id, outcome.
- PII (account numbers, names/description) never logged in plaintext — always masked.
- Envelope format is fixed: `{ message_id, timestamp, source_stage, target_stage, message_type, data }`.
- All new files live under `homework-6/`. Claude Code config under `homework-6/.claude/`.
- Author name in README: **Volodymyr Kiryakov**.
- Coverage gate blocks `git push` when total line coverage < 80%.
- ESM everywhere (`"type": "module"`). Test files: `tests/*.test.ts`.
- Commit after every task. Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `pipeline/types.ts` | Envelope + transaction data types, stage/status unions, `makeEnvelope`, `nowIso` |
| `pipeline/money.ts` | decimal.js config + money helpers |
| `pipeline/logger.ts` | audit log + PII masking |
| `pipeline/fs-utils.ts` | read/write/remove/clear envelope JSON files |
| `pipeline/stage-runner.ts` | generic file-bus stage runner |
| `pipeline/validator.ts` | validation handler + `runValidator` |
| `pipeline/fraud_detector.ts` | risk scoring handler + `runFraudDetector` |
| `pipeline/compliance.ts` | compliance handler + `runCompliance` |
| `pipeline/settlement.ts` | settlement handler + `runSettlement` |
| `pipeline/reporting.ts` | `buildSummary` + `writeSummary` |
| `orchestrator.ts` | `setupDirs`, `seedInput`, `runPipeline`, CLI entry |
| `mcp/server.ts` | MCP server (tools + resource) over query fns in `mcp/queries.ts` |
| `mcp/queries.ts` | pure functions reading `shared/results/` (unit-testable) |
| `frontend/` | Vite + React SPA + `api-server.ts` Express bridge |
| `tests/*.test.ts` | unit tests per module + integration test |
| `scripts/check-coverage.mjs` | coverage gate script |
| `.claude/commands/*.md` | `/write-spec`, `/run-pipeline`, `/validate-transactions` |
| `.claude/settings.json` | PreToolUse coverage-gate hook |
| Docs | `specification.md`, `agents.md`, `research-notes.md`, `README.md`, `HOWTORUN.md` |

---

## Task 1: Project scaffold + shared types

**Files:**
- Create: `homework-6/package.json`, `homework-6/tsconfig.json`, `homework-6/vitest.config.ts`, `homework-6/.gitignore`
- Create: `homework-6/sample-transactions.json` (copy of `sample-transaction.json`)
- Create: `homework-6/shared/{input,processing,output,results}/.gitkeep`
- Create: `homework-6/pipeline/types.ts`
- Test: `homework-6/tests/types.test.ts`

**Interfaces:**
- Produces: `Stage`, `TxnStatus`, `RawTransaction`, `TxnData`, `Envelope`, `SharedDirs`, `makeEnvelope(...)`, `nowIso()`.

- [ ] **Step 1: Write config files.**

`homework-6/package.json`:
```json
{
  "name": "hw6-transaction-pipeline",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "pipeline": "tsx orchestrator.ts",
    "validate": "tsx pipeline/validator.ts --dry-run",
    "mcp": "tsx mcp/server.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "decimal.js": "^10.4.3",
    "express": "^4.21.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.10.0",
    "@vitest/coverage-v8": "^2.1.8",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

`homework-6/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "noEmit": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "frontend"]
}
```

`homework-6/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      include: ["pipeline/**/*.ts", "mcp/queries.ts", "orchestrator.ts"],
      exclude: ["**/*.test.ts", "frontend/**"],
    },
  },
});
```

`homework-6/.gitignore`:
```
node_modules/
coverage/
dist/
shared/input/*.json
shared/processing/*.json
shared/output/*.json
shared/results/*.json
!shared/**/.gitkeep
frontend/dist/
frontend/node_modules/
```

- [ ] **Step 2: Copy sample data and create shared dirs.**

Run:
```bash
cd homework-6
cp sample-transaction.json sample-transactions.json
mkdir -p shared/input shared/processing shared/output shared/results
touch shared/input/.gitkeep shared/processing/.gitkeep shared/output/.gitkeep shared/results/.gitkeep
```

- [ ] **Step 3: Write `pipeline/types.ts`.**

```ts
import { randomUUID } from "node:crypto";

export type Stage = "validator" | "fraud_detector" | "compliance" | "settlement" | "reporting";
export type Target = Stage | "results";

export type TxnStatus =
  | "received" | "validated" | "rejected"
  | "flagged" | "cleared" | "hold" | "settled";

export interface RawTransaction {
  transaction_id: string;
  timestamp: string;
  source_account: string;
  destination_account: string;
  amount: string;
  currency: string;
  transaction_type: string;
  description: string;
  metadata: { channel: string; country: string };
}

export interface TxnData extends RawTransaction {
  status: TxnStatus;
  reason?: string;
  risk_score?: number;
  fraud_flags?: string[];
  compliance_flags?: string[];
  fee?: string;
  net_amount?: string;
}

export interface Envelope {
  message_id: string;
  timestamp: string;
  source_stage: Stage | "orchestrator";
  target_stage: Target;
  message_type: "transaction";
  data: TxnData;
}

export interface SharedDirs {
  base: string;
  input: string;
  processing: string;
  output: string;
  results: string;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function makeEnvelope(
  source: Envelope["source_stage"],
  target: Target,
  data: TxnData,
): Envelope {
  return {
    message_id: randomUUID(),
    timestamp: nowIso(),
    source_stage: source,
    target_stage: target,
    message_type: "transaction",
    data,
  };
}
```

- [ ] **Step 4: Write `tests/types.test.ts`.**

```ts
import { describe, it, expect } from "vitest";
import { makeEnvelope, nowIso, type TxnData } from "../pipeline/types.js";

const sample: TxnData = {
  transaction_id: "TXN001", timestamp: "2026-03-16T09:00:00Z",
  source_account: "ACC-1001", destination_account: "ACC-2001",
  amount: "1500.00", currency: "USD", transaction_type: "transfer",
  description: "rent", metadata: { channel: "online", country: "US" },
  status: "received",
};

describe("types", () => {
  it("nowIso returns an ISO 8601 string", () => {
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
  it("makeEnvelope stamps a uuid and copies data", () => {
    const e = makeEnvelope("orchestrator", "validator", sample);
    expect(e.message_id).toMatch(/[0-9a-f-]{36}/);
    expect(e.target_stage).toBe("validator");
    expect(e.data.transaction_id).toBe("TXN001");
    expect(e.message_type).toBe("transaction");
  });
});
```

- [ ] **Step 5: Install deps and run tests.**

Run:
```bash
cd homework-6 && npm install && npm test
```
Expected: install succeeds; `tests/types.test.ts` PASSES (2 tests).

- [ ] **Step 6: Commit.**

```bash
git add homework-6/package.json homework-6/package-lock.json homework-6/tsconfig.json homework-6/vitest.config.ts homework-6/.gitignore homework-6/sample-transactions.json homework-6/shared homework-6/pipeline/types.ts homework-6/tests/types.test.ts
git commit -m "feat(hw6): scaffold pipeline project + shared envelope types"
```

---

## Task 2: Money module (decimal.js)

**Files:**
- Create: `homework-6/pipeline/money.ts`
- Test: `homework-6/tests/money.test.ts`

**Interfaces:**
- Produces: `toDecimal(v)`, `isPositiveAmount(v)`, `addMoney(a,b)`, `mulMoney(a,factor)`, `roundCurrency(v)` — all string-in/string-out for money except predicates.

- [ ] **Step 1: Write `tests/money.test.ts`.**

```ts
import { describe, it, expect } from "vitest";
import { isPositiveAmount, addMoney, mulMoney, roundCurrency } from "../pipeline/money.js";

describe("money", () => {
  it("accepts a positive decimal string", () => {
    expect(isPositiveAmount("1500.00")).toBe(true);
  });
  it("rejects zero, negatives, and garbage", () => {
    expect(isPositiveAmount("0")).toBe(false);
    expect(isPositiveAmount("-100.00")).toBe(false);
    expect(isPositiveAmount("abc")).toBe(false);
    expect(isPositiveAmount("")).toBe(false);
  });
  it("adds without float error", () => {
    expect(addMoney("0.1", "0.2")).toBe("0.30");
  });
  it("multiplies and rounds HALF_UP to 2dp", () => {
    expect(mulMoney("1500.00", "0.005")).toBe("7.50");
    expect(roundCurrency("2.555")).toBe("2.56");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (`Cannot find module '../pipeline/money.js'`).

Run: `cd homework-6 && npx vitest run tests/money.test.ts`

- [ ] **Step 3: Write `pipeline/money.ts`.**

```ts
import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(v: string | number): Decimal {
  return new Decimal(v);
}

export function isPositiveAmount(v: string): boolean {
  if (v === undefined || v === null || v === "") return false;
  try {
    const d = new Decimal(v);
    return d.isFinite() && d.greaterThan(0);
  } catch {
    return false;
  }
}

export function roundCurrency(v: string | number | Decimal): string {
  return new Decimal(v).toFixed(2);
}

export function addMoney(a: string | number, b: string | number): string {
  return new Decimal(a).plus(b).toFixed(2);
}

export function mulMoney(a: string | number, factor: string | number): string {
  return new Decimal(a).mul(factor).toFixed(2);
}
```

- [ ] **Step 4: Run test — expect PASS.**

Run: `cd homework-6 && npx vitest run tests/money.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 5: Commit.**

```bash
git add homework-6/pipeline/money.ts homework-6/tests/money.test.ts
git commit -m "feat(hw6): decimal.js money helpers with HALF_UP rounding"
```

---

## Task 3: Logger + PII masking

**Files:**
- Create: `homework-6/pipeline/logger.ts`
- Test: `homework-6/tests/logger.test.ts`

**Interfaces:**
- Produces: `maskAccount(acc)`, `maskName(s)`, `AuditEntry`, `auditLog(stage, txnId, outcome, detail?) -> AuditEntry`.

- [ ] **Step 1: Write `tests/logger.test.ts`.**

```ts
import { describe, it, expect, vi } from "vitest";
import { maskAccount, maskName, auditLog } from "../pipeline/logger.js";

describe("logger", () => {
  it("masks account keeping only last 2 chars", () => {
    expect(maskAccount("ACC-1001")).toBe("ACC-****01");
    expect(maskAccount("X")).toBe("****");
  });
  it("masks a name to initials", () => {
    expect(maskName("Monthly rent payment")).toBe("M*** r*** p***");
  });
  it("auditLog returns an entry with ISO timestamp and no PII", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const e = auditLog("validator", "TXN001", "validated", "ok");
    expect(e.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(e.stage).toBe("validator");
    expect(e.transaction_id).toBe("TXN001");
    expect(e.outcome).toBe("validated");
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL.**

Run: `cd homework-6 && npx vitest run tests/logger.test.ts`

- [ ] **Step 3: Write `pipeline/logger.ts`.**

```ts
import { nowIso } from "./types.js";

export interface AuditEntry {
  timestamp: string;
  stage: string;
  transaction_id: string;
  outcome: string;
  detail?: string;
}

export function maskAccount(acc: string): string {
  if (!acc || acc.length <= 2) return "****";
  const prefixMatch = acc.match(/^[A-Za-z]+-/);
  const prefix = prefixMatch ? prefixMatch[0] : "";
  const last2 = acc.slice(-2);
  return `${prefix}****${last2}`;
}

export function maskName(s: string): string {
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((w) => (w ? `${w[0]}***` : ""))
    .join(" ")
    .trim();
}

export function auditLog(
  stage: string,
  transaction_id: string,
  outcome: string,
  detail?: string,
): AuditEntry {
  const entry: AuditEntry = { timestamp: nowIso(), stage, transaction_id, outcome, detail };
  console.log(
    `[${entry.timestamp}] stage=${stage} txn=${transaction_id} outcome=${outcome}` +
      (detail ? ` detail=${detail}` : ""),
  );
  return entry;
}
```

- [ ] **Step 4: Run test — expect PASS (3 tests).**

Run: `cd homework-6 && npx vitest run tests/logger.test.ts`

- [ ] **Step 5: Commit.**

```bash
git add homework-6/pipeline/logger.ts homework-6/tests/logger.test.ts
git commit -m "feat(hw6): audit logger with PII masking"
```

---

## Task 4: File-bus utilities + generic stage runner

**Files:**
- Create: `homework-6/pipeline/fs-utils.ts`, `homework-6/pipeline/stage-runner.ts`
- Test: `homework-6/tests/stage-runner.test.ts`

**Interfaces:**
- Produces (fs-utils): `ensureDir(d)`, `clearDir(d)`, `readEnvelopes(dir): Promise<Envelope[]>`, `writeEnvelope(dir, env): Promise<void>` (filename `${data.transaction_id}.json`), `removeEnvelope(dir, txnId): Promise<void>`.
- Produces (stage-runner): `type StageHandler = (data: TxnData) => { next: Target; data: TxnData }`; `runStage(dirs, stage, sourceDir, handler): Promise<void>`.

- [ ] **Step 1: Write `tests/stage-runner.test.ts`.**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureDir, readEnvelopes, writeEnvelope } from "../pipeline/fs-utils.js";
import { runStage } from "../pipeline/stage-runner.js";
import { makeEnvelope, type SharedDirs, type TxnData } from "../pipeline/types.js";

function dirs(base: string): SharedDirs {
  return { base, input: join(base, "input"), processing: join(base, "processing"),
    output: join(base, "output"), results: join(base, "results") };
}
const data: TxnData = {
  transaction_id: "TXN001", timestamp: "2026-03-16T09:00:00Z",
  source_account: "ACC-1001", destination_account: "ACC-2001", amount: "1500.00",
  currency: "USD", transaction_type: "transfer", description: "rent",
  metadata: { channel: "online", country: "US" }, status: "received",
};

let d: SharedDirs;
beforeEach(async () => {
  d = dirs(mkdtempSync(join(tmpdir(), "hw6-")));
  for (const p of [d.input, d.processing, d.output, d.results]) await ensureDir(p);
});

describe("runStage", () => {
  it("routes a passing record to output with the next target", async () => {
    await writeEnvelope(d.input, makeEnvelope("orchestrator", "validator", data));
    await runStage(d, "validator", d.input, (x) => ({ next: "fraud_detector", data: { ...x, status: "validated" } }));
    const out = await readEnvelopes(d.output);
    expect(out).toHaveLength(1);
    expect(out[0].target_stage).toBe("fraud_detector");
    expect(out[0].data.status).toBe("validated");
    expect(await readEnvelopes(d.input)).toHaveLength(0);
    expect(await readEnvelopes(d.processing)).toHaveLength(0);
  });
  it("routes a terminal record to results", async () => {
    await writeEnvelope(d.input, makeEnvelope("orchestrator", "validator", data));
    await runStage(d, "validator", d.input, (x) => ({ next: "results", data: { ...x, status: "rejected", reason: "bad" } }));
    const res = await readEnvelopes(d.results);
    expect(res[0].data.status).toBe("rejected");
    expect(await readEnvelopes(d.output)).toHaveLength(0);
  });
  it("only processes envelopes addressed to the stage", async () => {
    await writeEnvelope(d.output, makeEnvelope("validator", "compliance", data));
    await runStage(d, "fraud_detector", d.output, (x) => ({ next: "results", data: { ...x, status: "flagged" } }));
    expect(await readEnvelopes(d.results)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL.**

Run: `cd homework-6 && npx vitest run tests/stage-runner.test.ts`

- [ ] **Step 3: Write `pipeline/fs-utils.ts`.**

```ts
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Envelope } from "./types.js";

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function clearDir(dir: string): Promise<void> {
  await ensureDir(dir);
  const files = await readdir(dir);
  await Promise.all(
    files.filter((f) => f.endsWith(".json")).map((f) => rm(join(dir, f))),
  );
}

export async function readEnvelopes(dir: string): Promise<Envelope[]> {
  await ensureDir(dir);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const out: Envelope[] = [];
  for (const f of files) {
    out.push(JSON.parse(await readFile(join(dir, f), "utf8")) as Envelope);
  }
  return out;
}

export async function writeEnvelope(dir: string, env: Envelope): Promise<void> {
  await ensureDir(dir);
  await writeFile(join(dir, `${env.data.transaction_id}.json`), JSON.stringify(env, null, 2));
}

export async function removeEnvelope(dir: string, txnId: string): Promise<void> {
  await rm(join(dir, `${txnId}.json`), { force: true });
}
```

- [ ] **Step 4: Write `pipeline/stage-runner.ts`.**

```ts
import { auditLog } from "./logger.js";
import { readEnvelopes, writeEnvelope, removeEnvelope } from "./fs-utils.js";
import { makeEnvelope, type SharedDirs, type Stage, type Target, type TxnData } from "./types.js";

export type StageHandler = (data: TxnData) => { next: Target; data: TxnData };

export async function runStage(
  dirs: SharedDirs,
  stage: Stage,
  sourceDir: string,
  handler: StageHandler,
): Promise<void> {
  const pending = (await readEnvelopes(sourceDir)).filter((e) => e.target_stage === stage);
  for (const env of pending) {
    await writeEnvelope(dirs.processing, { ...env, source_stage: stage });
    const { next, data } = handler(env.data);
    await removeEnvelope(sourceDir, env.data.transaction_id);
    const out = makeEnvelope(stage, next, data);
    await writeEnvelope(next === "results" ? dirs.results : dirs.output, out);
    await removeEnvelope(dirs.processing, env.data.transaction_id);
    auditLog(stage, data.transaction_id, data.status, data.reason);
  }
}
```

- [ ] **Step 5: Run test — expect PASS (3 tests).**

Run: `cd homework-6 && npx vitest run tests/stage-runner.test.ts`

- [ ] **Step 6: Commit.**

```bash
git add homework-6/pipeline/fs-utils.ts homework-6/pipeline/stage-runner.ts homework-6/tests/stage-runner.test.ts
git commit -m "feat(hw6): file-bus fs utils + generic stage runner"
```

---

## Task 5: Validator stage

**Files:**
- Create: `homework-6/pipeline/validator.ts`
- Test: `homework-6/tests/validator.test.ts`

**Interfaces:**
- Produces: `ISO_4217: Set<string>`, `validateTransaction(data): { ok, status, reason? }`, `validatorHandler(data): {next, data}`, `runValidator(dirs)`, plus a `--dry-run` CLI (`dryRunReport(txns)`).

- [ ] **Step 1: Write `tests/validator.test.ts`.**

```ts
import { describe, it, expect } from "vitest";
import { validateTransaction, dryRunReport } from "../pipeline/validator.js";
import type { RawTransaction } from "../pipeline/types.js";

const base: RawTransaction = {
  transaction_id: "TXN001", timestamp: "2026-03-16T09:00:00Z",
  source_account: "ACC-1001", destination_account: "ACC-2001", amount: "1500.00",
  currency: "USD", transaction_type: "transfer", description: "rent",
  metadata: { channel: "online", country: "US" },
};

describe("validateTransaction", () => {
  it("accepts a well-formed USD transaction", () => {
    expect(validateTransaction(base)).toEqual({ ok: true, status: "validated" });
  });
  it("rejects a non-ISO-4217 currency", () => {
    const r = validateTransaction({ ...base, currency: "XYZ" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/currency/i);
  });
  it("rejects a non-positive amount", () => {
    const r = validateTransaction({ ...base, amount: "-100.00" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/amount/i);
  });
  it("rejects a missing required field", () => {
    const r = validateTransaction({ ...base, source_account: "" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/source_account/i);
  });
});

describe("dryRunReport", () => {
  it("counts valid and invalid", () => {
    const rep = dryRunReport([base, { ...base, transaction_id: "TXN006", currency: "XYZ" }]);
    expect(rep.total).toBe(2);
    expect(rep.valid).toBe(1);
    expect(rep.invalid).toBe(1);
    expect(rep.rows).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL.**

Run: `cd homework-6 && npx vitest run tests/validator.test.ts`

- [ ] **Step 3: Write `pipeline/validator.ts`.**

```ts
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isPositiveAmount } from "./money.js";
import { runStage, type StageHandler } from "./stage-runner.js";
import type { RawTransaction, SharedDirs, TxnData } from "./types.js";

export const ISO_4217 = new Set([
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "SEK", "NOK",
  "DKK", "SGD", "HKD", "CNY", "INR", "BRL", "ZAR", "MXN", "PLN", "AED",
]);

const REQUIRED: (keyof RawTransaction)[] = [
  "transaction_id", "timestamp", "source_account", "destination_account",
  "amount", "currency", "transaction_type",
];

export interface ValidationResult {
  ok: boolean;
  status: "validated" | "rejected";
  reason?: string;
}

export function validateTransaction(data: RawTransaction): ValidationResult {
  for (const field of REQUIRED) {
    if (!data[field] || String(data[field]).trim() === "") {
      return { ok: false, status: "rejected", reason: `missing required field: ${field}` };
    }
  }
  if (!isPositiveAmount(data.amount)) {
    return { ok: false, status: "rejected", reason: `invalid amount: ${data.amount} (must be > 0)` };
  }
  if (!ISO_4217.has(data.currency)) {
    return { ok: false, status: "rejected", reason: `unsupported currency: ${data.currency} (not ISO 4217)` };
  }
  return { ok: true, status: "validated" };
}

export const validatorHandler: StageHandler = (data) => {
  const r = validateTransaction(data);
  if (!r.ok) return { next: "results", data: { ...data, status: "rejected", reason: r.reason } };
  return { next: "fraud_detector", data: { ...data, status: "validated" } };
};

export async function runValidator(dirs: SharedDirs): Promise<void> {
  await runStage(dirs, "validator", dirs.input, validatorHandler);
}

export interface DryRunReport {
  total: number;
  valid: number;
  invalid: number;
  rows: { transaction_id: string; ok: boolean; reason?: string }[];
}

export function dryRunReport(txns: RawTransaction[]): DryRunReport {
  const rows = txns.map((t) => {
    const r = validateTransaction(t);
    return { transaction_id: t.transaction_id, ok: r.ok, reason: r.reason };
  });
  return {
    total: rows.length,
    valid: rows.filter((r) => r.ok).length,
    invalid: rows.filter((r) => !r.ok).length,
    rows,
  };
}

// CLI: tsx pipeline/validator.ts --dry-run
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes("--dry-run")) {
  const txns = JSON.parse(await readFile(new URL("../sample-transactions.json", import.meta.url), "utf8")) as RawTransaction[];
  const rep = dryRunReport(txns);
  console.log(`\nDry-run validation — total=${rep.total} valid=${rep.valid} invalid=${rep.invalid}\n`);
  console.table(rep.rows);
}
```

- [ ] **Step 4: Run test — expect PASS (6 tests).**

Run: `cd homework-6 && npx vitest run tests/validator.test.ts`

- [ ] **Step 5: Verify the dry-run CLI end-to-end.**

Run: `cd homework-6 && npx tsx pipeline/validator.ts --dry-run`
Expected: prints total=8 valid=6 invalid=2, and a table where TXN006 and TXN007 are `ok:false`.

- [ ] **Step 6: Commit.**

```bash
git add homework-6/pipeline/validator.ts homework-6/tests/validator.test.ts
git commit -m "feat(hw6): validator stage with ISO 4217 + amount checks and dry-run CLI"
```

---

## Task 6: Fraud detection stage

**Files:**
- Create: `homework-6/pipeline/fraud_detector.ts`
- Test: `homework-6/tests/fraud_detector.test.ts`

**Interfaces:**
- Produces: `FLAG_THRESHOLD = 50`, `scoreTransaction(data): { risk_score, fraud_flags }`, `fraudHandler`, `runFraudDetector(dirs)`.

- [ ] **Step 1: Write `tests/fraud_detector.test.ts`.**

```ts
import { describe, it, expect } from "vitest";
import { scoreTransaction, fraudHandler } from "../pipeline/fraud_detector.js";
import type { TxnData } from "../pipeline/types.js";

const base: TxnData = {
  transaction_id: "T", timestamp: "2026-03-16T09:00:00Z", source_account: "ACC-1",
  destination_account: "ACC-2", amount: "1500.00", currency: "USD",
  transaction_type: "transfer", description: "x", metadata: { channel: "online", country: "US" },
  status: "validated",
};

describe("scoreTransaction", () => {
  it("scores a normal domestic transfer as low risk", () => {
    expect(scoreTransaction(base).risk_score).toBeLessThan(50);
  });
  it("flags a high-value transfer > $10k", () => {
    const r = scoreTransaction({ ...base, amount: "25000.00" });
    expect(r.risk_score).toBeGreaterThanOrEqual(50);
    expect(r.fraud_flags).toContain("HIGH_VALUE");
  });
  it("flags near-threshold structuring just under $10k", () => {
    const r = scoreTransaction({ ...base, amount: "9999.99" });
    expect(r.fraud_flags).toContain("STRUCTURING");
    expect(r.risk_score).toBeGreaterThanOrEqual(50);
  });
  it("adds risk for night-time cross-border but stays below flag alone", () => {
    const r = scoreTransaction({ ...base, amount: "500.00", currency: "EUR",
      timestamp: "2026-03-16T02:47:00Z", metadata: { channel: "api", country: "DE" } });
    expect(r.fraud_flags).toEqual(expect.arrayContaining(["NIGHT_TIME", "CROSS_BORDER"]));
    expect(r.risk_score).toBeLessThan(50);
  });
});

describe("fraudHandler", () => {
  it("routes flagged txns to results", () => {
    expect(fraudHandler({ ...base, amount: "25000.00" }).next).toBe("results");
  });
  it("routes cleared txns to compliance", () => {
    expect(fraudHandler(base).next).toBe("compliance");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL.**

Run: `cd homework-6 && npx vitest run tests/fraud_detector.test.ts`

- [ ] **Step 3: Write `pipeline/fraud_detector.ts`.**

```ts
import { toDecimal } from "./money.js";
import { runStage, type StageHandler } from "./stage-runner.js";
import type { SharedDirs, TxnData } from "./types.js";

export const FLAG_THRESHOLD = 50;
const BASE_COUNTRY = "US";
const HIGH_VALUE = toDecimal("10000");
const STRUCTURING_FLOOR = toDecimal("9000");

export interface FraudResult {
  risk_score: number;
  fraud_flags: string[];
}

export function scoreTransaction(data: TxnData): FraudResult {
  const flags: string[] = [];
  let score = 0;
  const amount = toDecimal(data.amount);

  if (amount.greaterThan(HIGH_VALUE)) {
    score += 60;
    flags.push("HIGH_VALUE");
  } else if (amount.greaterThanOrEqualTo(STRUCTURING_FLOOR) && amount.lessThanOrEqualTo(HIGH_VALUE)) {
    score += 55;
    flags.push("STRUCTURING");
  }

  const hour = new Date(data.timestamp).getUTCHours();
  if (hour >= 0 && hour < 6) {
    score += 20;
    flags.push("NIGHT_TIME");
  }
  if (data.metadata.country !== BASE_COUNTRY) {
    score += 20;
    flags.push("CROSS_BORDER");
  }

  return { risk_score: Math.min(score, 100), fraud_flags: flags };
}

export const fraudHandler: StageHandler = (data) => {
  const { risk_score, fraud_flags } = scoreTransaction(data);
  const annotated: TxnData = { ...data, risk_score, fraud_flags };
  if (risk_score >= FLAG_THRESHOLD) {
    return {
      next: "results",
      data: { ...annotated, status: "flagged", reason: `risk ${risk_score}: ${fraud_flags.join(",")}` },
    };
  }
  return { next: "compliance", data: annotated };
};

export async function runFraudDetector(dirs: SharedDirs): Promise<void> {
  await runStage(dirs, "fraud_detector", dirs.output, fraudHandler);
}
```

- [ ] **Step 4: Run test — expect PASS (6 tests).**

Run: `cd homework-6 && npx vitest run tests/fraud_detector.test.ts`

- [ ] **Step 5: Commit.**

```bash
git add homework-6/pipeline/fraud_detector.ts homework-6/tests/fraud_detector.test.ts
git commit -m "feat(hw6): fraud detection stage with risk scoring"
```

---

## Task 7: Compliance stage

**Files:**
- Create: `homework-6/pipeline/compliance.ts`
- Test: `homework-6/tests/compliance.test.ts`

**Interfaces:**
- Produces: `SANCTIONED: Set<string>`, `checkCompliance(data): { status: "cleared"|"hold", compliance_flags }`, `complianceHandler`, `runCompliance(dirs)`.

- [ ] **Step 1: Write `tests/compliance.test.ts`.**

```ts
import { describe, it, expect } from "vitest";
import { checkCompliance, complianceHandler } from "../pipeline/compliance.js";
import type { TxnData } from "../pipeline/types.js";

const base: TxnData = {
  transaction_id: "T", timestamp: "2026-03-16T09:00:00Z", source_account: "ACC-1",
  destination_account: "ACC-2", amount: "1500.00", currency: "USD",
  transaction_type: "transfer", description: "x", metadata: { channel: "online", country: "US" },
  status: "validated",
};

describe("checkCompliance", () => {
  it("clears a normal domestic transaction with no flags", () => {
    const r = checkCompliance(base);
    expect(r.status).toBe("cleared");
    expect(r.compliance_flags).toHaveLength(0);
  });
  it("adds CROSS_BORDER_REVIEW for foreign country but still clears", () => {
    const r = checkCompliance({ ...base, metadata: { channel: "api", country: "DE" } });
    expect(r.status).toBe("cleared");
    expect(r.compliance_flags).toContain("CROSS_BORDER_REVIEW");
  });
  it("adds CTR_REQUIRED above $10k", () => {
    expect(checkCompliance({ ...base, amount: "25000.00" }).compliance_flags).toContain("CTR_REQUIRED");
  });
  it("holds a sanctioned account", () => {
    const r = checkCompliance({ ...base, destination_account: "ACC-BLOCKED" });
    expect(r.status).toBe("hold");
    expect(r.compliance_flags).toContain("SANCTIONS_HIT");
  });
});

describe("complianceHandler", () => {
  it("routes cleared to settlement", () => {
    expect(complianceHandler(base).next).toBe("settlement");
  });
  it("routes hold to results", () => {
    expect(complianceHandler({ ...base, destination_account: "ACC-BLOCKED" }).next).toBe("results");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL.**

Run: `cd homework-6 && npx vitest run tests/compliance.test.ts`

- [ ] **Step 3: Write `pipeline/compliance.ts`.**

```ts
import { toDecimal } from "./money.js";
import { runStage, type StageHandler } from "./stage-runner.js";
import type { SharedDirs, TxnData } from "./types.js";

export const SANCTIONED = new Set(["ACC-BLOCKED", "ACC-9000"]);
const BASE_COUNTRY = "US";
const CTR_THRESHOLD = toDecimal("10000");

export interface ComplianceResult {
  status: "cleared" | "hold";
  compliance_flags: string[];
}

export function checkCompliance(data: TxnData): ComplianceResult {
  const flags: string[] = [];
  if (toDecimal(data.amount).greaterThan(CTR_THRESHOLD)) flags.push("CTR_REQUIRED");
  if (data.metadata.country !== BASE_COUNTRY) flags.push("CROSS_BORDER_REVIEW");
  if (SANCTIONED.has(data.source_account) || SANCTIONED.has(data.destination_account)) {
    flags.push("SANCTIONS_HIT");
    return { status: "hold", compliance_flags: flags };
  }
  return { status: "cleared", compliance_flags: flags };
}

export const complianceHandler: StageHandler = (data) => {
  const { status, compliance_flags } = checkCompliance(data);
  const annotated: TxnData = { ...data, compliance_flags };
  if (status === "hold") {
    return { next: "results", data: { ...annotated, status: "hold", reason: `compliance hold: ${compliance_flags.join(",")}` } };
  }
  return { next: "settlement", data: { ...annotated, status: "cleared" } };
};

export async function runCompliance(dirs: SharedDirs): Promise<void> {
  await runStage(dirs, "compliance", dirs.output, complianceHandler);
}
```

- [ ] **Step 4: Run test — expect PASS (6 tests).**

Run: `cd homework-6 && npx vitest run tests/compliance.test.ts`

- [ ] **Step 5: Commit.**

```bash
git add homework-6/pipeline/compliance.ts homework-6/tests/compliance.test.ts
git commit -m "feat(hw6): compliance stage (CTR, cross-border, sanctions)"
```

---

## Task 8: Settlement stage

**Files:**
- Create: `homework-6/pipeline/settlement.ts`
- Test: `homework-6/tests/settlement.test.ts`

**Interfaces:**
- Produces: `FEE_RATES: Record<string, string>`, `settle(data): { fee, net_amount }`, `settlementHandler`, `runSettlement(dirs)`.

- [ ] **Step 1: Write `tests/settlement.test.ts`.**

```ts
import { describe, it, expect } from "vitest";
import { settle, settlementHandler } from "../pipeline/settlement.js";
import type { TxnData } from "../pipeline/types.js";

const base: TxnData = {
  transaction_id: "T", timestamp: "2026-03-16T09:00:00Z", source_account: "ACC-1",
  destination_account: "ACC-2", amount: "1500.00", currency: "USD",
  transaction_type: "transfer", description: "x", metadata: { channel: "online", country: "US" },
  status: "cleared",
};

describe("settle", () => {
  it("charges the transfer fee rate and computes net with HALF_UP", () => {
    const r = settle(base);
    expect(r.fee).toBe("7.50");        // 1500 * 0.005
    expect(r.net_amount).toBe("1492.50");
  });
  it("charges the wire fee rate", () => {
    const r = settle({ ...base, amount: "25000.00", transaction_type: "wire_transfer" });
    expect(r.fee).toBe("25.00");       // 25000 * 0.001
    expect(r.net_amount).toBe("24975.00");
  });
});

describe("settlementHandler", () => {
  it("settles and routes to results", () => {
    const out = settlementHandler(base);
    expect(out.next).toBe("results");
    expect(out.data.status).toBe("settled");
    expect(out.data.fee).toBe("7.50");
  });
});
```

- [ ] **Step 2: Run test — expect FAIL.**

Run: `cd homework-6 && npx vitest run tests/settlement.test.ts`

- [ ] **Step 3: Write `pipeline/settlement.ts`.**

```ts
import { mulMoney, addMoney, roundCurrency, toDecimal } from "./money.js";
import { runStage, type StageHandler } from "./stage-runner.js";
import type { SharedDirs, TxnData } from "./types.js";

export const FEE_RATES: Record<string, string> = {
  wire_transfer: "0.001",
  transfer: "0.005",
  refund: "0",
};
const DEFAULT_RATE = "0.005";

export interface SettlementResult {
  fee: string;
  net_amount: string;
}

export function settle(data: TxnData): SettlementResult {
  const rate = FEE_RATES[data.transaction_type] ?? DEFAULT_RATE;
  const fee = mulMoney(data.amount, rate);
  const net = roundCurrency(toDecimal(data.amount).minus(fee));
  // net = amount - fee (both already 2dp)
  void addMoney; // addMoney exported for reporting/tests
  return { fee, net_amount: net };
}

export const settlementHandler: StageHandler = (data) => {
  const { fee, net_amount } = settle(data);
  return { next: "results", data: { ...data, status: "settled", fee, net_amount } };
};

export async function runSettlement(dirs: SharedDirs): Promise<void> {
  await runStage(dirs, "settlement", dirs.output, settlementHandler);
}
```

> Note: remove the `void addMoney;` line and the `addMoney` import if unused after writing — keep imports honest. Final `settle` uses `mulMoney`, `roundCurrency`, `toDecimal` only.

- [ ] **Step 4: Fix imports** — `settlement.ts` imports only `{ mulMoney, roundCurrency, toDecimal }`. Delete the `addMoney` import and the `void addMoney;` line.

```ts
import { mulMoney, roundCurrency, toDecimal } from "./money.js";
```

- [ ] **Step 5: Run test — expect PASS (3 tests).**

Run: `cd homework-6 && npx vitest run tests/settlement.test.ts`

- [ ] **Step 6: Commit.**

```bash
git add homework-6/pipeline/settlement.ts homework-6/tests/settlement.test.ts
git commit -m "feat(hw6): settlement stage with decimal fee/net calculation"
```

---

## Task 9: Reporting + orchestrator + integration test

**Files:**
- Create: `homework-6/pipeline/reporting.ts`, `homework-6/orchestrator.ts`
- Test: `homework-6/tests/reporting.test.ts`, `homework-6/tests/integration.test.ts`

**Interfaces:**
- Produces (reporting): `Summary`, `buildSummary(results: Envelope[]): Summary`, `writeSummary(dirs, summary): Promise<string>`.
- Produces (orchestrator): `setupDirs(base): Promise<SharedDirs>`, `seedInput(dirs, txns): Promise<void>`, `runPipeline(base): Promise<Summary>`.

- [ ] **Step 1: Write `tests/reporting.test.ts`.**

```ts
import { describe, it, expect } from "vitest";
import { buildSummary } from "../pipeline/reporting.js";
import { makeEnvelope, type TxnData } from "../pipeline/types.js";

function res(id: string, status: TxnData["status"], reason?: string) {
  const data: TxnData = {
    transaction_id: id, timestamp: "2026-03-16T09:00:00Z", source_account: "ACC-1",
    destination_account: "ACC-2", amount: "100.00", currency: "USD",
    transaction_type: "transfer", description: "x",
    metadata: { channel: "online", country: "US" }, status, reason,
  };
  return makeEnvelope("settlement", "results", data);
}

describe("buildSummary", () => {
  it("aggregates counts by terminal status", () => {
    const s = buildSummary([
      res("T1", "settled"), res("T2", "settled"),
      res("T3", "flagged", "risk"), res("T4", "rejected", "bad currency"),
    ]);
    expect(s.total).toBe(4);
    expect(s.by_status.settled).toBe(2);
    expect(s.by_status.flagged).toBe(1);
    expect(s.by_status.rejected).toBe(1);
    expect(s.reasons.find((r) => r.transaction_id === "T4")?.reason).toMatch(/currency/);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL.** Run: `cd homework-6 && npx vitest run tests/reporting.test.ts`

- [ ] **Step 3: Write `pipeline/reporting.ts`.**

```ts
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir } from "./fs-utils.js";
import { nowIso, type Envelope, type SharedDirs, type TxnStatus } from "./types.js";

export interface Summary {
  run_at: string;
  total: number;
  by_status: Record<string, number>;
  reasons: { transaction_id: string; status: TxnStatus; reason?: string }[];
}

export function buildSummary(results: Envelope[]): Summary {
  const by_status: Record<string, number> = {};
  const reasons: Summary["reasons"] = [];
  for (const e of results) {
    const s = e.data.status;
    by_status[s] = (by_status[s] ?? 0) + 1;
    if (s !== "settled") {
      reasons.push({ transaction_id: e.data.transaction_id, status: s, reason: e.data.reason });
    }
  }
  return { run_at: nowIso(), total: results.length, by_status, reasons };
}

export async function writeSummary(dirs: SharedDirs, summary: Summary): Promise<string> {
  await ensureDir(dirs.results);
  const path = join(dirs.results, "summary.json");
  await writeFile(path, JSON.stringify(summary, null, 2));
  return path;
}
```

- [ ] **Step 4: Write `orchestrator.ts`.**

```ts
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { clearDir, ensureDir, readEnvelopes, writeEnvelope } from "./pipeline/fs-utils.js";
import { makeEnvelope, type RawTransaction, type SharedDirs } from "./pipeline/types.js";
import { runValidator } from "./pipeline/validator.js";
import { runFraudDetector } from "./pipeline/fraud_detector.js";
import { runCompliance } from "./pipeline/compliance.js";
import { runSettlement } from "./pipeline/settlement.js";
import { buildSummary, writeSummary, type Summary } from "./pipeline/reporting.js";

const HERE = dirname(fileURLToPath(import.meta.url));

export async function setupDirs(base: string): Promise<SharedDirs> {
  const dirs: SharedDirs = {
    base,
    input: join(base, "input"),
    processing: join(base, "processing"),
    output: join(base, "output"),
    results: join(base, "results"),
  };
  for (const d of [dirs.input, dirs.processing, dirs.output, dirs.results]) {
    await ensureDir(d);
    await clearDir(d);
  }
  return dirs;
}

export async function seedInput(dirs: SharedDirs, txns: RawTransaction[]): Promise<void> {
  for (const t of txns) {
    await writeEnvelope(dirs.input, makeEnvelope("orchestrator", "validator", { ...t, status: "received" }));
  }
}

export async function runPipeline(base: string = join(HERE, "shared")): Promise<Summary> {
  const dirs = await setupDirs(base);
  const txns = JSON.parse(await readFile(join(HERE, "sample-transactions.json"), "utf8")) as RawTransaction[];
  await seedInput(dirs, txns);

  await runValidator(dirs);
  await runFraudDetector(dirs);
  await runCompliance(dirs);
  await runSettlement(dirs);

  const summary = buildSummary(await readEnvelopes(dirs.results));
  await writeSummary(dirs, summary);
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const summary = await runPipeline();
  console.log("\n=== Pipeline summary ===");
  console.log(JSON.stringify(summary, null, 2));
}
```

- [ ] **Step 5: Write `tests/integration.test.ts`.**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runPipeline } from "../orchestrator.js";
import { readEnvelopes } from "../pipeline/fs-utils.js";
import type { Envelope } from "../pipeline/types.js";

describe("full pipeline (integration)", () => {
  let results: Envelope[];
  let base: string;
  beforeAll(async () => {
    base = mkdtempSync(join(tmpdir(), "hw6-int-"));
    await runPipeline(base);
    results = await readEnvelopes(join(base, "results"));
  });

  it("produces a terminal result for all 8 sample transactions", () => {
    const ids = results.map((e) => e.data.transaction_id).filter((id) => id.startsWith("TXN"));
    expect(new Set(ids).size).toBe(8);
  });
  it("rejects TXN006 (bad currency) and TXN007 (negative amount)", () => {
    const byId = Object.fromEntries(results.map((e) => [e.data.transaction_id, e.data]));
    expect(byId["TXN006"].status).toBe("rejected");
    expect(byId["TXN007"].status).toBe("rejected");
  });
  it("flags the high-value / structuring txns", () => {
    const byId = Object.fromEntries(results.map((e) => [e.data.transaction_id, e.data]));
    expect(byId["TXN002"].status).toBe("flagged");
    expect(byId["TXN003"].status).toBe("flagged");
    expect(byId["TXN005"].status).toBe("flagged");
  });
  it("settles the clean txns with a computed fee", () => {
    const byId = Object.fromEntries(results.map((e) => [e.data.transaction_id, e.data]));
    expect(byId["TXN001"].status).toBe("settled");
    expect(byId["TXN001"].fee).toBe("7.50");
    expect(byId["TXN008"].status).toBe("settled");
  });
  it("writes a summary.json", () => {
    const s = JSON.parse(readFileSync(join(base, "results", "summary.json"), "utf8"));
    expect(s.total).toBe(8);
    expect(s.by_status.settled).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 6: Run tests — expect PASS.**

Run: `cd homework-6 && npx vitest run tests/reporting.test.ts tests/integration.test.ts`
Expected: reporting (1) + integration (5) PASS.

- [ ] **Step 7: Run the real pipeline end-to-end.**

Run: `cd homework-6 && npm run pipeline`
Expected: audit lines for 8 txns; summary JSON with `total: 8`; files appear in `homework-6/shared/results/`.

- [ ] **Step 8: Full test + coverage snapshot.**

Run: `cd homework-6 && npm run coverage`
Expected: all tests pass; coverage table printed. Confirm ≥80% (target ≥90%). If a stage is under-covered, add a focused unit test before committing.

- [ ] **Step 9: Commit.**

```bash
git add homework-6/pipeline/reporting.ts homework-6/orchestrator.ts homework-6/tests/reporting.test.ts homework-6/tests/integration.test.ts
git commit -m "feat(hw6): reporting + orchestrator + full-pipeline integration test"
```

---

## Task 10: Custom MCP server

**Files:**
- Create: `homework-6/mcp/queries.ts`, `homework-6/mcp/server.ts`, `homework-6/mcp.json`
- Test: `homework-6/tests/mcp-queries.test.ts`

**Interfaces:**
- Produces (queries): `getTransactionStatus(resultsDir, id): Promise<object>`, `listPipelineResults(resultsDir): Promise<object>`, `pipelineSummaryText(resultsDir): Promise<string>`.
- `server.ts` wires these into `registerTool`/`registerResource` over stdio.

- [ ] **Step 1: Write `tests/mcp-queries.test.ts`.**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runPipeline } from "../orchestrator.js";
import { getTransactionStatus, listPipelineResults } from "../mcp/queries.js";

let resultsDir: string;
beforeAll(async () => {
  const base = mkdtempSync(join(tmpdir(), "hw6-mcp-"));
  await runPipeline(base);
  resultsDir = join(base, "results");
});

describe("mcp queries", () => {
  it("returns the status of a known transaction", async () => {
    const r = await getTransactionStatus(resultsDir, "TXN006");
    expect(r.found).toBe(true);
    expect(r.status).toBe("rejected");
  });
  it("returns not-found for an unknown transaction", async () => {
    expect((await getTransactionStatus(resultsDir, "NOPE")).found).toBe(false);
  });
  it("lists all processed results with counts", async () => {
    const r = await listPipelineResults(resultsDir);
    expect(r.total).toBe(8);
    expect(r.transactions.length).toBe(8);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL.** Run: `cd homework-6 && npx vitest run tests/mcp-queries.test.ts`

- [ ] **Step 3: Write `mcp/queries.ts`.**

```ts
import { join } from "node:path";
import { readEnvelopes } from "../pipeline/fs-utils.js";

const DEFAULT_RESULTS = join(process.cwd(), "shared", "results");

export async function getTransactionStatus(resultsDir: string = DEFAULT_RESULTS, id: string) {
  const envs = await readEnvelopes(resultsDir);
  const match = envs.find((e) => e.data.transaction_id === id);
  if (!match) return { found: false, transaction_id: id };
  return {
    found: true,
    transaction_id: id,
    status: match.data.status,
    reason: match.data.reason,
    risk_score: match.data.risk_score,
    fee: match.data.fee,
    net_amount: match.data.net_amount,
  };
}

export async function listPipelineResults(resultsDir: string = DEFAULT_RESULTS) {
  const envs = await readEnvelopes(resultsDir);
  const by_status: Record<string, number> = {};
  const transactions = envs.map((e) => {
    by_status[e.data.status] = (by_status[e.data.status] ?? 0) + 1;
    return { transaction_id: e.data.transaction_id, status: e.data.status, reason: e.data.reason };
  });
  return { total: transactions.length, by_status, transactions };
}

export async function pipelineSummaryText(resultsDir: string = DEFAULT_RESULTS): Promise<string> {
  const { total, by_status } = await listPipelineResults(resultsDir);
  const lines = Object.entries(by_status).map(([k, v]) => `  ${k}: ${v}`);
  return `Pipeline summary — ${total} transactions processed\n${lines.join("\n")}`;
}
```

- [ ] **Step 4: Run test — expect PASS (3 tests).** Run: `cd homework-6 && npx vitest run tests/mcp-queries.test.ts`

- [ ] **Step 5: Write `mcp/server.ts`** (verified against context7 `/modelcontextprotocol/typescript-sdk`).

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getTransactionStatus, listPipelineResults, pipelineSummaryText } from "./queries.js";

const server = new McpServer({ name: "pipeline-status", version: "1.0.0" });

server.registerTool(
  "get_transaction_status",
  {
    title: "Get transaction status",
    description: "Return the current pipeline status of a transaction by id, from shared/results/.",
    inputSchema: { transaction_id: z.string().describe("e.g. TXN001") },
  },
  async ({ transaction_id }) => {
    const r = await getTransactionStatus(undefined, transaction_id);
    return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
  },
);

server.registerTool(
  "list_pipeline_results",
  {
    title: "List pipeline results",
    description: "Return a summary of all processed transactions and status counts.",
    inputSchema: {},
  },
  async () => {
    const r = await listPipelineResults();
    return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
  },
);

server.registerResource(
  "summary",
  "pipeline://summary",
  { title: "Pipeline summary", description: "Latest pipeline run summary as text", mimeType: "text/plain" },
  async (uri) => ({ contents: [{ uri: uri.href, text: await pipelineSummaryText() }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 6: Write `mcp.json`.**

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "pipeline-status": {
      "command": "npx",
      "args": ["-y", "tsx", "mcp/server.ts"]
    }
  }
}
```

- [ ] **Step 7: Smoke-test the server boots** (starts, then Ctrl-C / kill; stdio server waits for a client).

Run: `cd homework-6 && timeout 3 npx tsx mcp/server.ts; echo "exit=$?"`
Expected: no crash/stack trace before timeout (exit from timeout is fine). Any import/type error must be fixed.

- [ ] **Step 8: Typecheck.**

Run: `cd homework-6 && npm run typecheck`
Expected: no errors.

- [ ] **Step 9: Commit.**

```bash
git add homework-6/mcp/queries.ts homework-6/mcp/server.ts homework-6/mcp.json homework-6/tests/mcp-queries.test.ts
git commit -m "feat(hw6): custom MCP server (status/list tools + summary resource) + mcp.json"
```

---

## Task 11: Front-end (Vite + React SPA + Express bridge)

**Files:**
- Create: `homework-6/frontend/package.json`, `vite.config.ts`, `index.html`, `tsconfig.json`
- Create: `homework-6/frontend/api-server.ts`
- Create: `homework-6/frontend/src/main.tsx`, `src/App.tsx`, `src/api.ts`, `src/styles.css`

**Interfaces:**
- Bridge endpoints: `POST /api/run` → `{ summary }`; `GET /api/results` → `{ total, by_status, transactions }`; `GET /api/summary` → summary JSON.

- [ ] **Step 1: Scaffold the frontend package.**

`homework-6/frontend/package.json`:
```json
{
  "name": "hw6-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "api": "tsx api-server.ts",
    "serve": "npm run build && tsx api-server.ts"
  },
  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1" },
  "devDependencies": {
    "@types/react": "^18.3.12", "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4", "express": "^4.21.2",
    "tsx": "^4.19.2", "typescript": "^5.7.2", "vite": "^6.0.3"
  }
}
```

`homework-6/frontend/vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://localhost:8787" } },
  build: { outDir: "dist" },
});
```

`homework-6/frontend/index.html`:
```html
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Transaction Pipeline Dashboard</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

`homework-6/frontend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
    "jsx": "react-jsx", "strict": true, "skipLibCheck": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"], "types": ["node"], "noEmit": true
  },
  "include": ["src", "api-server.ts", "vite.config.ts"]
}
```

- [ ] **Step 2: Write `frontend/api-server.ts`.**

```ts
import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPipeline } from "../orchestrator.js";
import { listPipelineResults } from "../mcp/queries.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const SHARED = join(HERE, "..", "shared");
const RESULTS = join(SHARED, "results");
const app = express();

app.post("/api/run", async (_req, res) => {
  const summary = await runPipeline(SHARED);
  res.json({ summary });
});

app.get("/api/results", async (_req, res) => {
  res.json(await listPipelineResults(RESULTS));
});

app.get("/api/summary", async (_req, res) => {
  res.json((await listPipelineResults(RESULTS)));
});

// Serve the built SPA if present
app.use(express.static(join(HERE, "dist")));

const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, () => console.log(`API + dashboard on http://localhost:${PORT}`));
```

- [ ] **Step 3: Write `frontend/src/api.ts`.**

```ts
export interface ResultRow { transaction_id: string; status: string; reason?: string }
export interface ResultsResponse { total: number; by_status: Record<string, number>; transactions: ResultRow[] }

export async function runPipeline(): Promise<void> {
  await fetch("/api/run", { method: "POST" });
}
export async function fetchResults(): Promise<ResultsResponse> {
  const r = await fetch("/api/results");
  return r.json();
}
```

- [ ] **Step 4: Write `frontend/src/App.tsx`.**

```tsx
import { useEffect, useState } from "react";
import { fetchResults, runPipeline, type ResultsResponse } from "./api";

const STATUS_COLORS: Record<string, string> = {
  settled: "#1a7f37", flagged: "#9a6700", rejected: "#cf222e", hold: "#8250df",
};

export default function App() {
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() { setData(await fetchResults()); }
  useEffect(() => { refresh().catch(() => {}); }, []);

  async function onRun() {
    setBusy(true);
    try { await runPipeline(); await refresh(); } finally { setBusy(false); }
  }

  return (
    <main className="wrap">
      <header>
        <h1>🏦 Transaction Pipeline Dashboard</h1>
        <button onClick={onRun} disabled={busy}>{busy ? "Running…" : "▶ Run pipeline"}</button>
      </header>

      <section className="counters">
        {data && Object.entries(data.by_status).map(([k, v]) => (
          <div key={k} className="counter" style={{ borderColor: STATUS_COLORS[k] ?? "#999" }}>
            <span className="count">{v}</span><span className="label">{k}</span>
          </div>
        ))}
        {data && <div className="counter"><span className="count">{data.total}</span><span className="label">total</span></div>}
      </section>

      <table>
        <thead><tr><th>Transaction</th><th>Status</th><th>Reason / flags</th></tr></thead>
        <tbody>
          {data?.transactions.map((t) => (
            <tr key={t.transaction_id}>
              <td>{t.transaction_id}</td>
              <td><span className="badge" style={{ background: STATUS_COLORS[t.status] ?? "#666" }}>{t.status}</span></td>
              <td>{t.reason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data && <p>Loading… run the pipeline to populate results.</p>}
    </main>
  );
}
```

- [ ] **Step 5: Write `frontend/src/main.tsx` and `frontend/src/styles.css`.**

`main.tsx`:
```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
```

`styles.css`:
```css
:root { color-scheme: light dark; font-family: system-ui, sans-serif; }
body { margin: 0; background: #f6f8fa; color: #1f2328; }
.wrap { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
header { display: flex; align-items: center; justify-content: space-between; }
button { background: #1f6feb; color: #fff; border: 0; padding: .6rem 1rem; border-radius: 6px; font-size: 1rem; cursor: pointer; }
button:disabled { opacity: .6; cursor: default; }
.counters { display: flex; gap: 1rem; margin: 1.5rem 0; flex-wrap: wrap; }
.counter { border: 2px solid #999; border-radius: 8px; padding: .8rem 1.2rem; min-width: 90px; text-align: center; background: #fff; }
.counter .count { display: block; font-size: 1.8rem; font-weight: 700; }
.counter .label { color: #57606a; text-transform: uppercase; font-size: .75rem; }
table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
th, td { text-align: left; padding: .6rem .8rem; border-bottom: 1px solid #eaeef2; }
.badge { color: #fff; padding: .15rem .5rem; border-radius: 999px; font-size: .8rem; }
```

- [ ] **Step 6: Install frontend deps and verify build.**

Run: `cd homework-6/frontend && npm install && npm run build`
Expected: `dist/` is produced with no build errors.

- [ ] **Step 7: Verify the bridge serves and runs a pipeline.**

Run (background): `cd homework-6/frontend && (npm run api &) && sleep 2 && curl -s -X POST http://localhost:8787/api/run | head -c 200 && echo && curl -s http://localhost:8787/api/results | head -c 200`
Expected: `/api/run` returns a summary; `/api/results` returns `total: 8`. Kill the background server afterward.

- [ ] **Step 8: Commit.**

```bash
git add homework-6/frontend
git commit -m "feat(hw6): Vite/React dashboard + Express bridge to pipeline"
```

---

## Task 12: Skills + coverage-gate hook

**Files:**
- Create: `homework-6/.claude/commands/write-spec.md`, `run-pipeline.md`, `validate-transactions.md`
- Create: `homework-6/scripts/check-coverage.mjs`
- Create: `homework-6/.claude/settings.json`

**Interfaces:**
- `check-coverage.mjs` reads `coverage/coverage-summary.json`, compares `total.lines.pct` to a threshold (default 80), exits 1 if below.

- [ ] **Step 1: Write `.claude/commands/run-pipeline.md`.**

```markdown
---
description: Run the transaction processing pipeline end-to-end and summarize results
---

Run the transaction processing pipeline end-to-end.

Steps:
1. Check that `sample-transactions.json` exists (fail clearly if not).
2. Clear the `shared/` directories.
3. Run the pipeline: `npm run pipeline`.
4. Show a summary of results from `shared/results/` (read `shared/results/summary.json`).
5. Report any transactions that were rejected, flagged, or held and why (from each result's `reason`).
```

- [ ] **Step 2: Write `.claude/commands/validate-transactions.md`.**

```markdown
---
description: Validate all sample transactions without running the full pipeline
---

Validate all transactions in `sample-transactions.json` without processing them.

Steps:
1. Run the validator in dry-run mode: `npm run validate` (i.e. `tsx pipeline/validator.ts --dry-run`).
2. Report: total count, valid count, invalid count, and the reason for each rejection.
3. Show the results as a table.
```

- [ ] **Step 3: Write `.claude/commands/write-spec.md`.**

```markdown
---
description: Generate a specification.md for a pipeline feature from the project template
---

Generate a `specification.md` for the requested feature following this exact template.
Ask the user for the feature name and pipeline stages if not provided, then fill every section.

# [Feature Name] Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code
> that will satisfy the High and Mid-Level Objectives.

## High-Level Objective
- [One sentence describing what the pipeline does]

## Mid-Level Objectives
- [4–5 concrete, testable requirements]

## Implementation Notes
- Monetary values: decimal.js only, never float; ROUND_HALF_UP.
- Currency codes: ISO 4217.
- Logging: audit trail with ISO 8601 timestamp, stage, transaction id, outcome.
- PII: mask account numbers and names — never log plaintext.

## Context
### Beginning context
- `sample-transactions.json` with raw records
### Ending context
- Processed results in `shared/results/`, a `summary.json`, tests ≥90% coverage

## Low-Level Tasks
> One entry per pipeline stage.
1. Task: [Stage Name]
   Prompt: "[Exact prompt you will give the code-gen agent]"
   File to CREATE: `pipeline/[stage].ts`
   Function to CREATE: `[stageHandler / run<Stage>]`
   Details: [what the stage checks, transforms, or decides]
```

- [ ] **Step 4: Write `scripts/check-coverage.mjs`.**

```js
#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";

const THRESHOLD = Number(process.env.COVERAGE_MIN ?? 80);
const summaryPath = join(process.cwd(), "coverage", "coverage-summary.json");

let pct;
try {
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  pct = summary.total.lines.pct;
} catch {
  console.error(`\n❌ coverage gate: no coverage report at ${summaryPath}. Run \`npm run coverage\` first.`);
  process.exit(1);
}

if (pct < THRESHOLD) {
  console.error(`\n❌ coverage gate FAILED: line coverage ${pct}% < ${THRESHOLD}% — push blocked.`);
  process.exit(1);
}
console.log(`✅ coverage gate passed: line coverage ${pct}% ≥ ${THRESHOLD}%.`);
process.exit(0);
```

- [ ] **Step 5: Write `.claude/settings.json` (PreToolUse coverage-gate hook).**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -Eq 'git[[:space:]]+push'; then cd \"$CLAUDE_PROJECT_DIR\" && npm run coverage --silent >/dev/null 2>&1; node scripts/check-coverage.mjs 1>&2 || { echo 'BLOCK: coverage below 80% — push rejected by hook.' 1>&2; exit 2; }; fi"
          }
        ]
      }
    ]
  }
}
```

> Note: Claude Code passes the tool payload via stdin and `$CLAUDE_TOOL_INPUT`/`$CLAUDE_PROJECT_DIR` env. Exit code 2 blocks the tool call. During execution, verify the exact env var names against the installed Claude Code version and adjust if needed (fallback: read stdin JSON). A native git `pre-push` hook (Step 6) is the robust backup that the screenshot will demonstrate.

- [ ] **Step 6: Add a native git `pre-push` hook as the demonstrable backup.**

Create `homework-6/scripts/pre-push` (documented in HOWTORUN as `cp scripts/pre-push ../.git/hooks/pre-push && chmod +x`):
```bash
#!/usr/bin/env bash
set -e
cd "$(git rev-parse --show-toplevel)/homework-6"
npm run coverage --silent
node scripts/check-coverage.mjs
```

- [ ] **Step 7: Test the gate script both ways.**

Run (pass case): `cd homework-6 && npm run coverage --silent && node scripts/check-coverage.mjs`
Expected: `✅ coverage gate passed …`.

Run (fail case): `cd homework-6 && COVERAGE_MIN=99.9 node scripts/check-coverage.mjs`
Expected: `❌ coverage gate FAILED …` and exit code 1 (verify with `echo $?`). This is the shot for `hook-trigger.png`.

- [ ] **Step 8: Commit.**

```bash
git add homework-6/.claude homework-6/scripts
git commit -m "feat(hw6): skills (write-spec/run-pipeline/validate) + coverage-gate hook"
```

---

## Task 13: Documentation (specification, agents, research-notes, README, HOWTORUN)

**Files:**
- Create: `homework-6/specification.md`, `agents.md`, `research-notes.md`, `README.md`, `HOWTORUN.md`

- [ ] **Step 1: Write `specification.md`** following the Homework-3 template with all 5 sections (High-Level, Mid-Level ×4–5, Implementation Notes, Context, Low-Level Tasks — one entry per stage: validator, fraud_detector, compliance, settlement, reporting). Fill each Low-Level Task with the exact prompt, file, function, and details matching the implemented code.

- [ ] **Step 2: Write `agents.md`** documenting the four workflow agents (Specification, Code-generation, Unit-tests, Documentation), the project context (file-based protocol, envelope format, stages, tech stack), and how each agent's plus-requirement (skill / context7 / coverage hook / author name) is satisfied.

- [ ] **Step 3: Write `research-notes.md`** with the two real context7 queries already executed:
  - Query 1 — MCP TypeScript SDK. Search: "Model Context Protocol TypeScript SDK — build server with stdio, tools, resources". Library ID: `/modelcontextprotocol/typescript-sdk`. Applied: `McpServer` + `registerTool({inputSchema: {..zod..}})` + `registerResource(uri, …)` + `StdioServerTransport`; `content: [{type:"text", text}]` return shape.
  - Query 2 — decimal.js. Search: "decimal arithmetic ROUND_HALF_UP for money in JavaScript". Library ID: `/mikemcl/decimal.js`. Applied: `Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })`; `.plus/.mul/.toFixed(2)` for fee/net calc.
  - (Optional Query 3 — vitest coverage, if run.)

- [ ] **Step 4: Write `README.md`** — must include: **Created by Volodymyr Kiryakov**; 1–2 paragraph description; one bullet per stage responsibility; an ASCII architecture diagram of the pipeline flow; and a tech-stack table.

ASCII diagram to embed:
```
 sample-transactions.json
          │  (orchestrator seeds envelopes)
          ▼
   ┌───────────────┐   reject    ┌──────────┐
   │  validator    │────────────▶│          │
   └───────┬───────┘             │          │
           │ validated           │          │
           ▼                     │          │
   ┌───────────────┐   flag      │ results/ │
   │ fraud_detector│────────────▶│  (JSON)  │
   └───────┬───────┘             │          │
           │ cleared             │          │
           ▼                     │          │
   ┌───────────────┐   hold      │          │
   │  compliance   │────────────▶│          │
   └───────┬───────┘             │          │
           │ cleared             │          │
           ▼                     │          │
   ┌───────────────┐   settled   │          │
   │  settlement   │────────────▶│          │
   └───────────────┘             └────┬─────┘
                                      │
                                      ▼
                               reporting → summary.json
```

- [ ] **Step 5: Write `HOWTORUN.md`** — numbered steps: install (root + frontend), run pipeline (`npm run pipeline`), validate (`npm run validate`), tests + coverage (`npm run coverage`), front-end (`cd frontend && npm run serve` → open http://localhost:8787), MCP server (`mcp.json`, both servers), and installing the git pre-push hook.

- [ ] **Step 6: Commit.**

```bash
git add homework-6/specification.md homework-6/agents.md homework-6/research-notes.md homework-6/README.md homework-6/HOWTORUN.md
git commit -m "docs(hw6): specification, agents, research-notes, README, HOWTORUN"
```

---

## Task 14: Autonomous finishing — screenshots + presentation

**Files:**
- Create: `homework-6/docs/screenshots/*.png` (6), `homework-6/docs/slides/index.html`, `homework-6/docs/presentation.pdf`, `homework-6/scripts/render-pdf.mjs`

- [ ] **Step 1: Capture the front-end screenshot live.**
  - Start the bridge: `cd homework-6/frontend && npm run serve` (background).
  - Use chrome-devtools MCP: `new_page` → `navigate_page http://localhost:8787` → click "Run pipeline" → `wait_for` table rows → `take_screenshot` → save as `docs/screenshots/frontend.png`.

- [ ] **Step 2: Capture terminal-style screenshots.** For each of `pipeline-run`, `test-coverage`, `skill-run-pipeline`, `hook-trigger`, `mcp-interaction`: run the real command, capture true stdout, render it into a styled HTML "console" (monospace, dark bg), open via chrome-devtools, and `take_screenshot`:
  - `pipeline-run.png` — output of `npm run pipeline`.
  - `test-coverage.png` — output of `npm run coverage` (coverage table, ≥90%).
  - `skill-run-pipeline.png` — the `/run-pipeline` skill steps + resulting summary.
  - `hook-trigger.png` — `COVERAGE_MIN=99.9 node scripts/check-coverage.mjs` showing the block.
  - `mcp-interaction.png` — a context7 query result **and** a `get_transaction_status`/`list_pipeline_results` call result.

- [ ] **Step 3: Build the presentation deck** `docs/slides/index.html` (use frontend-slides skill): title (project + author), architecture (embed ASCII/diagram), the 4 pipeline stages, demo screenshots, tech stack, lessons learned.

- [ ] **Step 4: Render the deck to PDF** via `scripts/render-pdf.mjs` (puppeteer headless `page.pdf`), output `docs/presentation.pdf`. If puppeteer install is blocked, fall back to a print-to-PDF via chrome-devtools and note the method.

- [ ] **Step 5: Verify the PDF opens** (non-zero size, correct page count).

Run: `cd homework-6 && ls -la docs/presentation.pdf && file docs/presentation.pdf`

- [ ] **Step 6: Commit.**

```bash
git add homework-6/docs
git commit -m "docs(hw6): screenshots + capstone presentation PDF"
```

---

## Finalization (after all tasks)

- [ ] Run the full suite once more: `cd homework-6 && npm run coverage && npm run typecheck` — all green, coverage ≥90%.
- [ ] Update `homework-6/docs/superpowers/specs/...` checklist boxes if desired.
- [ ] Invoke `superpowers:finishing-a-development-branch` to prepare the PR (branch already `homework-6`). Draft the PR description with: spec produced, pipeline run, front-end demo, tests/coverage, skill/hook in action, MCP usage, README (author name), embedded/linked screenshots, and the presentation PDF link. **Do not push / open the PR until the user confirms.** No `gh` CLI — use GitHub REST API via stored git credentials.

---

## Self-Review (plan vs. spec)

**Spec coverage:** Task 1 (spec) → specification.md (Task 13) + `/write-spec` (Task 12) + agents.md (Task 13). Task 2 (pipeline) → Tasks 4–9 stages + orchestrator; context7 → research-notes (Task 13) using live queries. Front-end → Task 11. Task 3 (skills+hook) → Task 12. Task 4 (MCP: context7 + custom server) → mcp.json + server (Task 10), context7 documented (Task 13). Task 5 (tests+docs+presentation) → tests across Tasks 2–10, README/HOWTORUN (Task 13), presentation + screenshots (Task 14). All six required screenshots enumerated in Task 14. ✓

**Placeholder scan:** No TBD/TODO in code steps; every code step shows full content. Docs Tasks 13/14 describe exact required content (author name, ASCII diagram, 6 named screenshots) rather than leaving them open. ✓

**Type consistency:** `Envelope`/`TxnData`/`Stage`/`Target`/`SharedDirs` defined in Task 1 and reused verbatim. `StageHandler` returns `{ next: Target; data: TxnData }` (Task 4) and every stage handler (Tasks 5–8) matches. `runValidator/runFraudDetector/runCompliance/runSettlement` names consistent between stage files and orchestrator (Task 9). `getTransactionStatus/listPipelineResults/pipelineSummaryText` consistent between `mcp/queries.ts` and `mcp/server.ts` (Task 10) and the api-server (Task 11). `settle` uses only `mulMoney/roundCurrency/toDecimal` after the Step-4 import fix (Task 8). ✓

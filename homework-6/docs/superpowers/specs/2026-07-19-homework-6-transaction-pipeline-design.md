# Homework 6 — AI-Powered Transaction Processing Pipeline — Design

> Brainstorming design doc (process artifact). Separate from the graded `specification.md`
> deliverable (Task 1), which this doc drives the creation of.

- **Author:** Volodymyr Kiryakov
- **Date:** 2026-07-19
- **Stack decision:** Node / TypeScript (approved). Python-shaped examples in `TASKS.md`
  are adapted to TS equivalents and confirmed via live context7 queries.

---

## 1. Goal

Build a file-based transaction processing pipeline (validation → fraud detection →
compliance → settlement, plus a reporting summary) with a Vite/React front-end, a custom
MCP server, two Claude Code slash-command skills, a coverage-gate hook, tests (≥80% gate,
≥90% target), and full documentation — all self-contained under `homework-6/`.

The four "AI agents" from the assignment map to workflow phases/deliverables, not literal
runtime agents:

| Agent | Deliverable it produces |
|-------|-------------------------|
| Agent 1 — Specification | `specification.md`, `agents.md`, `/write-spec` skill |
| Agent 2 — Code generation | pipeline stages + orchestrator + front-end; ≥2 context7 queries in `research-notes.md` |
| Agent 3 — Unit tests | `tests/`, coverage-gate hook in `.claude/settings.json` |
| Agent 4 — Documentation | `README.md` (with author name), `HOWTORUN.md`, presentation PDF |

## 2. Project layout (self-contained in `homework-6/`)

```
homework-6/
├── specification.md  agents.md  research-notes.md  README.md  HOWTORUN.md  mcp.json
├── package.json  tsconfig.json  vitest.config.ts
├── sample-transactions.json          # copy of provided sample-transaction.json (plural name per TASKS.md)
├── orchestrator.ts                   # runner: seeds input/, runs stages in order, monitors results/
├── pipeline/
│   ├── types.ts        # envelope record + data shapes + stage enums
│   ├── money.ts        # decimal.js helpers: parse, add, mul, ROUND_HALF_UP
│   ├── logger.ts       # audit log: ISO 8601 ts, stage, txn id, outcome; PII masking
│   ├── validator.ts    # required fields, amount > 0, ISO 4217 currency; supports dry-run
│   ├── fraud_detector.ts
│   ├── compliance.ts
│   ├── settlement.ts
│   └── reporting.ts    # aggregates results/ → summary.json + console report
├── mcp/server.ts       # @modelcontextprotocol/sdk stdio server
├── frontend/
│   ├── index.html  vite.config.ts  package.json
│   ├── src/…           # React dashboard
│   └── api-server.ts   # Express bridge: POST /api/run, GET /api/results, GET /api/summary
├── tests/              # vitest unit tests per stage + money + logger + integration
├── shared/{input,processing,output,results}/   # file-based protocol dirs (gitkeep)
├── scripts/check-coverage.mjs                  # coverage gate: <80% → exit 1
├── docs/{presentation.pdf, slides/, screenshots/*.png, superpowers/specs/}
└── .claude/
    ├── commands/{write-spec.md, run-pipeline.md, validate-transactions.md}
    └── settings.json   # PreToolUse hook on `git push` → check-coverage
```

Everything lives under `homework-6/.claude/` so the folder is self-contained: opening Claude
Code with `homework-6` as the working directory activates `/write-spec`, `/run-pipeline`,
`/validate-transactions`, and the coverage-gate hook.

## 3. File-based pipeline protocol

`shared/` has four dirs: `input/`, `processing/`, `output/`, `results/`. The orchestrator
drops raw records into `input/`. Each stage:

1. reads pending records from the previous stage's `output/` (or `input/` for the validator),
2. moves the record to `processing/` while working,
3. writes the transformed record to `output/` for the next stage,
4. or writes a terminal outcome (`rejected` / `flagged` / `settled`) to `results/`.

Record envelope (exactly as in TASKS.md):

```json
{
  "message_id": "uuid4-string",
  "timestamp": "2026-03-16T10:00:00Z",
  "source_stage": "validator",
  "target_stage": "fraud_detector",
  "message_type": "transaction",
  "data": { "transaction_id": "TXN001", "amount": "1500.00", "currency": "USD", "status": "validated" }
}
```

Flow:

```
input → [validator] → [fraud_detector] → [compliance] → [settlement] → results
              rejected↓          flagged↓        hold↓        settled↓
                              (terminal outcomes land in results/ at their stage)
[reporting] reads results/ → summary.json + console report
```

## 4. Stage responsibilities

- **Validator** — required fields present; `amount` parses to a positive decimal; `currency`
  is a known ISO 4217 code. Fail → `results/` with `status: rejected` + `reason`. Supports a
  `--dry-run` mode (validate + report, no file movement) for `/validate-transactions`.
- **Fraud detector** — computes a risk score (0–100) from rules: high-value (> $10k),
  near-threshold structuring (just under $10k), unusual timing (night hours in UTC),
  cross-border (`metadata.country` ≠ base country). Score ≥ threshold → `status: flagged`
  (terminal, into results/); else annotate `risk_score` and pass on.
- **Compliance** — CTR reporting flag for amounts > $10k; cross-border review; sanctions-list
  hook (stub list). Non-blocking issues annotate `compliance_flags`; a blocking issue →
  `status: hold` (terminal). Otherwise pass on as `status: cleared`.
- **Settlement** — for cleared transactions, compute fee (e.g. wire vs transfer) and net
  amount with `decimal.js` + `ROUND_HALF_UP`; write `status: settled` to results/.
- **Reporting** — aggregate all results/: totals, pass/fail counts, per-status breakdown,
  rejection/flag reasons → `results/summary.json` + formatted console output.

## 5. Behaviour on the sample data

| TXN | Amount | Terminal status | Reason |
|-----|--------|-----------------|--------|
| 001 | 1500 USD | settled | normal |
| 002 | 25000 USD wire | flagged (+ CTR) | high-value > $10k |
| 003 | 9999.99 USD | flagged | structuring — just under $10k |
| 004 | 500 EUR 02:47 DE | settled (compliance-reviewed) | night + cross-border → risk noted, still valid |
| 005 | 75000 USD wire | flagged (+ CTR) | very high-value |
| 006 | 200 XYZ | rejected | currency not ISO 4217 |
| 007 | -100.00 GBP | rejected | amount ≤ 0 |
| 008 | 3200 USD | settled | normal |

Decision: TXN007 (`-100.00` refund) is treated as **invalid** (`amount ≤ 0`) to give a clean
second validation rejection. All eight transactions reach `results/`.

## 6. Key requirement → TS mapping

- **Money:** `decimal.js`, never `float`; `ROUND_HALF_UP` in settlement.
- **MCP server:** `@modelcontextprotocol/sdk` over stdio. Tools `get_transaction_status`
  (`transaction_id: str` → status from results/), `list_pipeline_results` (summary of all).
  Resource `pipeline://summary` (latest run summary as text).
- **mcp.json:** configures both `context7` (npx `@upstash/context7-mcp`) and `pipeline-status`
  (`node mcp/server.ts` via tsx).
- **context7 (Agent 2):** ≥2 live queries documented in `research-notes.md` — search string,
  returned library ID, applied insight. Candidates: decimal.js, MCP TS SDK, vitest coverage.
- **Coverage gate:** `scripts/check-coverage.mjs` reads vitest coverage-summary JSON; a
  `PreToolUse` hook in `.claude/settings.json` matches `git push` Bash commands and blocks
  when total coverage < 80%. A native git `pre-push` hook calls the same script as backup.
- **Skills:** `/write-spec` (generates a spec from the template), `/run-pipeline`,
  `/validate-transactions` — all in `.claude/commands/`.
- **Logging/PII:** audit log lines carry ISO 8601 timestamp, stage, transaction id, outcome;
  account numbers and names are masked (never plaintext-logged).

## 7. Front-end (Vite + React SPA + Express bridge)

- **SPA** (`frontend/src/`): a dashboard with a "Run pipeline" button, a results table
  (txn id, amount, currency, status, reason/flags), and pass/fail/flag counters.
- **Express bridge** (`frontend/api-server.ts`): `POST /api/run` runs the orchestrator via
  child_process; `GET /api/results` returns results/ records; `GET /api/summary` returns
  the summary. Vite dev server proxies `/api` to the bridge. `npm run frontend` serves the
  built SPA + API on one port for a clean screenshot/demo.

## 8. Tests & coverage

vitest + `@vitest/coverage-v8`. Unit tests per stage (valid + invalid branches) plus money
and logger; one integration test runs the orchestrator over the sample data in an isolated
`tmp` dir (never touching the real `shared/`). Gate ≥80%, target ≥90%.

## 9. Autonomous finishing

- **Screenshots:** front-end captured live via chrome-devtools MCP against the running Vite
  server (`frontend.png`). Terminal-style shots (`pipeline-run`, `test-coverage`, `skill`,
  `hook`, `mcp-interaction`) are produced by running the real commands, rendering their true
  output into a styled HTML "console", and screenshotting that via the same headless browser.
- **Presentation:** HTML deck (frontend-slides skill) → PDF via headless print (puppeteer) →
  `docs/presentation.pdf`.
- **PR:** branch + description prepared with all links/screenshots. Final push/PR only after
  user confirmation; no `gh` CLI — GitHub REST API via stored git credentials.

## 10. Out of scope (YAGNI)

- No real bank integrations, auth, or persistence beyond JSON files.
- No message queue — the file-based protocol is the transport.
- No production deployment; local dev + demo only.

## 11. Deliverables checklist (maps to TASKS.md)

- [ ] `specification.md`, `agents.md`, `/write-spec` skill
- [ ] `orchestrator.ts` + 4 stage modules + reporting; front-end; `research-notes.md` (2+ context7)
- [ ] `/run-pipeline`, `/validate-transactions` skills; coverage-gate hook in `.claude/settings.json`
- [ ] `mcp.json` (context7 + pipeline-status); `mcp/server.ts`
- [ ] `tests/`; `README.md` (author name + ASCII diagram); `HOWTORUN.md`
- [ ] `docs/presentation.pdf`; `docs/screenshots/` (6 shots); PR description

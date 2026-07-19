# 🏦 Transaction Processing Pipeline

**Created by Volodymyr Kiryakov** — Homework 6 capstone (AI-powered transaction processing pipeline).

## What it does

This project is a file-based transaction processing pipeline for bank transactions. Raw records
from `sample-transactions.json` flow through four stages — **validation**, **fraud detection**,
**compliance**, and **settlement** — and a final **reporting** step aggregates the outcomes.
Stages communicate by passing JSON *envelope* files through the `shared/` directories: an
orchestrator seeds `shared/input/`, `shared/output/` acts as a message bus keyed by each
envelope's `target_stage`, and terminal outcomes (`rejected`, `flagged`, `hold`, `settled`)
land in `shared/results/` alongside a `summary.json`.

All money is handled with `decimal.js` (never floats, `ROUND_HALF_UP`), every stage writes an
ISO-8601 audit line, and account numbers/names are masked so PII is never logged in plaintext.
A **Vite/React dashboard** lets you trigger a run and watch the results, and a custom
**MCP server** makes the pipeline queryable by AI tools.

## Pipeline stages

- **Validator** — checks required fields, a positive decimal amount, and an ISO 4217 currency; rejects otherwise.
- **Fraud detector** — scores risk (high-value > $10k, near-threshold structuring, night-time, cross-border) and flags at score ≥ 50.
- **Compliance** — annotates CTR-required (> $10k) and cross-border review; holds transactions touching a sanctioned account.
- **Settlement** — computes fee and net amount for cleared transactions with precise decimal arithmetic.
- **Reporting** — aggregates all results into per-status counts and rejection/flag reasons (`summary.json`).

## Architecture

```
 sample-transactions.json
          │  (orchestrator seeds envelopes into shared/input/)
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
                          reporting → shared/results/summary.json
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                                               ▼
     Vite/React dashboard                         MCP server (pipeline-status)
     (Express bridge /api)                get_transaction_status · list_pipeline_results
                                                    · resource pipeline://summary
```

## Tech stack

| Layer | Technology |
|-------|------------|
| Language / runtime | TypeScript on Node.js 24 (run via `tsx`) |
| Money | `decimal.js` (precision 28, `ROUND_HALF_UP`) |
| Validation schema | `zod` (MCP tool inputs) |
| Tests / coverage | `vitest` + `@vitest/coverage-v8` (gate ≥ 80%, actual ≥ 95%) |
| MCP server | `@modelcontextprotocol/sdk` (stdio) |
| Front-end | Vite + React 18, Express bridge |
| Automation | Claude Code slash-command skills + coverage-gate hook |

## Quick start

```bash
cd homework-6
npm install
npm run pipeline      # run the full pipeline → shared/results/
npm run coverage      # tests + coverage report
cd frontend && npm install && npm run serve   # dashboard on http://localhost:8787
```

See [HOWTORUN.md](HOWTORUN.md) for the full step-by-step guide (pipeline, front-end, tests, MCP).

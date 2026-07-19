# Transaction Processing Pipeline Specification

> Ingest the information from this file, implement the Low-Level Tasks, and generate the code
> that will satisfy the High and Mid-Level Objectives.

**Author:** Volodymyr Kiryakov
**Stack:** Node.js + TypeScript (tsx, vitest, decimal.js, zod, @modelcontextprotocol/sdk, Express, Vite/React)

---

## High-Level Objective

- Build a file-based transaction processing pipeline that validates raw bank transactions, scores them for fraud, checks compliance, settles the clean ones, and reports a run summary — observable through a web dashboard and queryable through a custom MCP server.

## Mid-Level Objectives

- Transactions with a non-ISO-4217 currency or a non-positive amount are **rejected** at validation with a `reason` field, and written to `shared/results/`.
- Transactions above $10,000 (or just under, as structuring) are **flagged for fraud review** with a numeric `risk_score`; cross-border and night-time activity add risk.
- Compliance annotates each cleared transaction (CTR reporting above $10k, cross-border review) and **holds** any transaction touching a sanctioned account.
- Settlement computes fee and net amount for cleared transactions using precise decimal arithmetic (`ROUND_HALF_UP`) — never floating point.
- Every pipeline stage logs an audit line with an ISO 8601 timestamp, stage name, transaction id, and outcome; account numbers and names are masked (never logged in plaintext).
- Test coverage is ≥ 90% (gate blocks push below 80%).

## Implementation Notes

- **Monetary values:** `decimal.js` only, configured `Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })`. Never use `number`/`float` arithmetic for money.
- **Currency codes:** validated against an ISO 4217 allow-set (USD, EUR, GBP, JPY, …).
- **Logging:** audit trail with timestamp, stage name, transaction id, and outcome.
- **PII:** account numbers and names/descriptions are treated as sensitive — masked via `maskAccount` / `maskName`, never logged in plaintext.
- **Transport:** stages communicate through JSON envelope files in `shared/`. `shared/output/` is a message bus keyed by each envelope's `target_stage`; terminal outcomes land in `shared/results/`.
- **Envelope format:** `{ message_id, timestamp, source_stage, target_stage, message_type, data }`.

## Context

### Beginning context
- `sample-transactions.json` — 8 raw transaction records.
- Empty `shared/{input,processing,output,results}/` directories.

### Ending context
- Processed results (one JSON envelope per transaction) in `shared/results/`.
- A `shared/results/summary.json` pipeline summary report.
- A test suite with ≥ 90% coverage, a web dashboard, and a custom MCP server.

## Low-Level Tasks

### 1. Task: Validation Stage
- **Prompt:** "Create a validator that checks required fields, a positive decimal amount, and an ISO 4217 currency; reject with a reason otherwise. Add a `--dry-run` CLI that reports counts and a table."
- **File to CREATE:** `pipeline/validator.ts`
- **Function to CREATE:** `validateTransaction(data: RawTransaction): ValidationResult`, `validatorHandler`, `runValidator(dirs)`, `dryRunReport(txns)`
- **Details:** Required fields present and non-empty; `isPositiveAmount(amount)`; `ISO_4217.has(currency)`. Pass → `fraud_detector`; fail → `results` as `rejected`.

### 2. Task: Fraud Detection Stage
- **Prompt:** "Create a risk scorer: +60 high-value (> $10k), +55 near-threshold structuring ($9k–$10k), +20 night-time (UTC 00:00–06:00), +20 cross-border. Flag at score ≥ 50."
- **File to CREATE:** `pipeline/fraud_detector.ts`
- **Function to CREATE:** `scoreTransaction(data): FraudResult`, `fraudHandler`, `runFraudDetector(dirs)`
- **Details:** Annotate `risk_score` + `fraud_flags`. Score ≥ `FLAG_THRESHOLD` (50) → `results` as `flagged`; else → `compliance`.

### 3. Task: Compliance Check Stage
- **Prompt:** "Create a compliance check: flag CTR_REQUIRED above $10k, CROSS_BORDER_REVIEW for foreign country, and hold on a sanctioned account."
- **File to CREATE:** `pipeline/compliance.ts`
- **Function to CREATE:** `checkCompliance(data): ComplianceResult`, `complianceHandler`, `runCompliance(dirs)`
- **Details:** Non-blocking flags annotate `compliance_flags`; a `SANCTIONS_HIT` sets status `hold` → `results`. Otherwise `cleared` → `settlement`.

### 4. Task: Settlement Stage
- **Prompt:** "Create settlement: fee = amount × rate (wire 0.001, transfer 0.005), net = amount − fee, using decimal.js with ROUND_HALF_UP."
- **File to CREATE:** `pipeline/settlement.ts`
- **Function to CREATE:** `settle(data): SettlementResult`, `settlementHandler`, `runSettlement(dirs)`
- **Details:** Compute `fee` and `net_amount` as 2-dp decimal strings; write `settled` → `results`.

### 5. Task: Reporting Stage
- **Prompt:** "Aggregate all result envelopes into a summary with total, per-status counts, and reasons for non-settled transactions; write `summary.json`."
- **File to CREATE:** `pipeline/reporting.ts`
- **Function to CREATE:** `buildSummary(results: Envelope[]): Summary`, `writeSummary(dirs, summary)`
- **Details:** Count by terminal `status`; collect `{transaction_id, status, reason}` for every non-`settled` outcome.

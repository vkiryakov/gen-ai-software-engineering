# Agents — Transaction Processing Pipeline

This capstone was built with four AI workflow agents. Each maps to a phase of the
development workflow and to a concrete deliverable in this repo. "Agent" here means a
distinct role in the AI-assisted workflow (a skill, a prompt, a review gate) — not a
runtime process.

## Project context (shared by all agents)

- **Domain:** bank transaction processing — validate, detect fraud, check compliance, settle, report.
- **Transport:** file-based. Stages exchange JSON **envelopes** through `shared/`. `shared/output/`
  is a message bus keyed by `target_stage`; terminal outcomes land in `shared/results/`.
- **Envelope:** `{ message_id, timestamp, source_stage, target_stage, message_type, data }`.
- **Stages:** `validator → fraud_detector → compliance → settlement`, plus `reporting` (summary).
- **Money:** `decimal.js` with `ROUND_HALF_UP`, never floats.
- **Tech stack:** Node + TypeScript, tsx, vitest + v8 coverage, zod, `@modelcontextprotocol/sdk`,
  Express, Vite + React.

## Agent 1 — Specification

- **Role:** produce the detailed technical specification before any code.
- **Deliverables:** [`specification.md`](specification.md), this `agents.md`, and the
  [`/write-spec`](.claude/commands/write-spec.md) slash-command skill that generates a
  specification from the project template.

## Agent 2 — Code generation

- **Role:** implement the pipeline stages, orchestrator, MCP server, and front-end.
- **Deliverables:** [`orchestrator.ts`](orchestrator.ts), [`pipeline/`](pipeline/) stage modules,
  [`frontend/`](frontend/) dashboard, [`mcp/`](mcp/) server.
- **Plus (MCP context7):** context7 was used during code generation to look up the framework
  APIs (MCP TypeScript SDK, decimal.js). See [`research-notes.md`](research-notes.md) for the
  documented queries and applied patterns.

## Agent 3 — Unit tests

- **Role:** create the test suite and enforce the coverage gate.
- **Deliverables:** [`tests/`](tests/) (unit tests per stage + one integration test).
- **Plus (hook):** a coverage-gate hook ([`.claude/settings.json`](.claude/settings.json) +
  [`scripts/coverage-gate-hook.mjs`](scripts/coverage-gate-hook.mjs)) that regenerates coverage
  and **blocks `git push`** when total line coverage is below 80%. A native git `pre-push`
  backup lives at [`scripts/pre-push`](scripts/pre-push).

## Agent 4 — Documentation

- **Role:** produce the README and project documentation.
- **Deliverables:** [`README.md`](README.md) (with author name and ASCII architecture diagram),
  [`HOWTORUN.md`](HOWTORUN.md), and the capstone presentation (`docs/presentation.pdf`).
- **Plus (requirement):** README includes the author — **Created by Volodymyr Kiryakov**.

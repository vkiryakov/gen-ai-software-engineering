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

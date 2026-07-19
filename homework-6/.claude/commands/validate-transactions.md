---
description: Validate all sample transactions without running the full pipeline
---

Validate all transactions in `sample-transactions.json` without processing them.

Steps:
1. Run the validator in dry-run mode: `npm run validate` (i.e. `tsx pipeline/validator.ts --dry-run`).
2. Report: total count, valid count, invalid count, and the reason for each rejection.
3. Show the results as a table.

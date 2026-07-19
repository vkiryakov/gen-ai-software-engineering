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

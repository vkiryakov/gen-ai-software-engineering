# How to Run

## Prerequisites
- Node.js (v18+)
- `claude` CLI installed and authenticated (the pipeline calls it headlessly)

## 1. Install dependencies

```bash
cd homework-4
npm install
```

## 2. Run the sample app on its own (optional sanity check)

```bash
npm start          # listens on PORT (default 3000)
npm test           # baseline tests
```

## 3. Run the full 4-agent pipeline (single command)

```bash
npm run pipeline
# equivalent to: ./run-pipeline.sh 001
```

This chains, in order, against `context/bugs/001/`:

1. `bug-researcher` → `research/codebase-research.md`
2. `research-verifier` → `research/verified-research.md` (stops the pipeline if Research Quality is LOW)
3. `bug-planner` → `implementation-plan.md`
4. `bug-fixer` → edits `src/`, runs `npm test` after each change, writes `fix-summary.md` (stops the pipeline if it doesn't report success)
5. `security-verifier` → `security-report.md`
6. `unit-test-generator` → adds tests under `tests/`, writes `test-report.md`

Per-stage logs are written to `docs/pipeline-logs/<stage>.log`. The script
runs with `--permission-mode bypassPermissions`, so it needs no manual
approval between steps — expect it to take a few minutes total.

## 4. Verify the result

```bash
npm test           # should now show 3 suites / 23+ tests passing
cat context/bugs/001/fix-summary.md
cat context/bugs/001/security-report.md
cat context/bugs/001/test-report.md
```

## Re-running on a fresh bug

The app resets to its seeded-bug state only if you restore `src/` from git
(the fixes are applied in place). To try the pipeline on a different bug id,
create `context/bugs/<id>/bug-context.md` and run `npm run pipeline <id>`.

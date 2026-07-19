# How to run

Step-by-step guide to run the pipeline, the front-end, the tests, and the MCP server.
All commands are run from the `homework-6/` directory unless noted.

## 1. Prerequisites

- Node.js ≥ 20 (developed on Node 24) and npm.
- No database or external services required — everything is file-based.

## 2. Install dependencies

```bash
cd homework-6
npm install
cd frontend && npm install && cd ..
```

## 3. Run the full pipeline

```bash
npm run pipeline
```

- Seeds `shared/input/` from `sample-transactions.json`.
- Runs validator → fraud_detector → compliance → settlement.
- Writes one result envelope per transaction to `shared/results/` plus `shared/results/summary.json`.
- Prints an audit line per stage and the final summary.

Expected: 8 transactions processed — 3 settled, 3 flagged, 2 rejected.

## 4. Validate transactions only (dry run)

```bash
npm run validate
```

Runs the validator in dry-run mode and prints total / valid / invalid counts and a table
(TXN006 rejected: bad currency; TXN007 rejected: negative amount).

## 5. Run the tests and coverage

```bash
npm test        # run all unit + integration tests
npm run coverage    # same, with a coverage report in coverage/
```

Coverage is ≥ 95% (gate blocks push below 80%). The HTML report is at `coverage/index.html`.

## 6. Run the front-end dashboard

```bash
cd frontend
npm run serve      # builds the SPA and starts the Express bridge
```

Open **http://localhost:8787**. Click **▶ Run pipeline** to trigger a run; the table and
counters update from `shared/results/`.

For live development with hot reload (SPA on :5173 proxying `/api` to the bridge on :8787):

```bash
# terminal 1
cd frontend && npm run api
# terminal 2
cd frontend && npm run dev
```

## 7. Use the MCP servers

`mcp.json` configures two MCP servers:

- **context7** — `npx -y @upstash/context7-mcp@latest` (library docs lookup).
- **pipeline-status** — `npx -y tsx mcp/server.ts` (this project's custom server).

The custom server exposes:

- Tool `get_transaction_status` — `{ transaction_id }` → current status from `shared/results/`.
- Tool `list_pipeline_results` — summary of all processed transactions.
- Resource `pipeline://summary` — latest run summary as text.

Try it end-to-end with the bundled demo client (run the pipeline first so results exist):

```bash
npm run pipeline
npx tsx scripts/mcp-demo.mts
```

## 8. Install the coverage-gate git hook (optional backup)

The Claude Code hook in `.claude/settings.json` blocks `git push` when coverage < 80%.
To also enforce it with a native git hook:

```bash
cp scripts/pre-push ../.git/hooks/pre-push
chmod +x ../.git/hooks/pre-push
```

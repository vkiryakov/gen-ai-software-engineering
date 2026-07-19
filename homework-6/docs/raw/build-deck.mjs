// Builds a print-first 16:9 HTML slide deck → docs/slides/index.html
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const img = JSON.parse(readFileSync(join(HERE, "img-data.json"), "utf8"));

const slides = [
  // 1 — title
  `<section class="slide title">
    <div class="kicker">Homework 6 · Capstone</div>
    <h1>🏦 Transaction Processing Pipeline</h1>
    <p class="lede">A file-based, AI-built pipeline: validate → detect fraud → check compliance → settle → report</p>
    <div class="by">Created by <strong>Volodymyr Kiryakov</strong></div>
    <div class="stackline">TypeScript · decimal.js · vitest · Model Context Protocol · Vite/React</div>
  </section>`,

  // 2 — overview
  `<section class="slide">
    <h2>What it does</h2>
    <p class="big">Raw bank transactions flow through four stages and a reporting step. Stages exchange
    <strong>JSON envelopes</strong> through <code>shared/</code> directories — no database, no queue.</p>
    <ul class="checks">
      <li>Precise money with <strong>decimal.js</strong> (ROUND_HALF_UP), never floats</li>
      <li>Audit log per stage (ISO 8601) with <strong>PII masking</strong></li>
      <li>Web dashboard to run &amp; observe · custom <strong>MCP server</strong> to query</li>
      <li><strong>≥95%</strong> test coverage · push blocked below 80% by a hook</li>
    </ul>
  </section>`,

  // 3 — architecture
  `<section class="slide">
    <h2>Architecture — file-based envelope bus</h2>
    <pre class="diagram">sample-transactions.json
        │  orchestrator seeds shared/input/
        ▼
  validator ──reject──▶┐
        │ validated     │
  fraud_detector ─flag─▶│  shared/results/   ──▶  reporting → summary.json
        │ cleared       │   (terminal JSON)              │
  compliance ────hold──▶│                                ├─▶ Vite/React dashboard
        │ cleared       │                                └─▶ MCP server (pipeline-status)
  settlement ──settled─▶┘</pre>
    <p class="note">Envelope: <code>{ message_id, timestamp, source_stage, target_stage, message_type, data }</code>.
    <code>shared/output/</code> is a bus keyed by <code>target_stage</code>; a generic runner wraps each pure stage handler.</p>
  </section>`,

  // 4 — stages
  `<section class="slide">
    <h2>Pipeline stages</h2>
    <table class="stages">
      <tr><th>Stage</th><th>Decides</th></tr>
      <tr><td><b>Validator</b></td><td>required fields · amount &gt; 0 · ISO 4217 currency → else <span class="rej">rejected</span></td></tr>
      <tr><td><b>Fraud detector</b></td><td>risk score: high-value &gt;$10k · structuring · night-time · cross-border → <span class="flag">flagged</span> at ≥50</td></tr>
      <tr><td><b>Compliance</b></td><td>CTR &gt;$10k · cross-border review · sanctions → <span class="hold">hold</span></td></tr>
      <tr><td><b>Settlement</b></td><td>fee = amount × rate · net = amount − fee (decimal) → <span class="set">settled</span></td></tr>
      <tr><td><b>Reporting</b></td><td>aggregate results → per-status counts + reasons (summary.json)</td></tr>
    </table>
  </section>`,

  // 5 — sample outcomes
  `<section class="slide">
    <h2>Outcomes on the sample data (8 txns)</h2>
    <table class="stages">
      <tr><th>Txn</th><th>Amount</th><th>Result</th><th>Why</th></tr>
      <tr><td>TXN001 / 008</td><td>1 500 / 3 200 USD</td><td><span class="set">settled</span></td><td>normal</td></tr>
      <tr><td>TXN004</td><td>500 EUR · 02:47 · DE</td><td><span class="set">settled</span></td><td>night + cross-border noted, still valid</td></tr>
      <tr><td>TXN002 / 005</td><td>25 000 / 75 000 USD</td><td><span class="flag">flagged</span></td><td>high-value &gt; $10k (+ CTR)</td></tr>
      <tr><td>TXN003</td><td>9 999.99 USD</td><td><span class="flag">flagged</span></td><td>structuring — just under $10k</td></tr>
      <tr><td>TXN006</td><td>200 XYZ</td><td><span class="rej">rejected</span></td><td>currency not ISO 4217</td></tr>
      <tr><td>TXN007</td><td>-100.00 GBP</td><td><span class="rej">rejected</span></td><td>amount ≤ 0</td></tr>
    </table>
    <p class="note">Result: 3 settled · 3 flagged · 2 rejected — every branch exercised.</p>
  </section>`,

  // 6 — AI workflow
  `<section class="slide">
    <h2>The AI workflow — 4 agents</h2>
    <div class="grid2">
      <div class="card"><h3>1 · Specification</h3><p>specification.md + <code>/write-spec</code> skill</p></div>
      <div class="card"><h3>2 · Code generation</h3><p>stages + orchestrator + UI; <b>context7</b> for MCP SDK &amp; decimal.js</p></div>
      <div class="card"><h3>3 · Unit tests</h3><p>vitest suite + <b>coverage-gate hook</b> (blocks push &lt;80%)</p></div>
      <div class="card"><h3>4 · Documentation</h3><p>README + HOWTORUN + this deck</p></div>
    </div>
    <p class="note">MCP: <b>context7</b> (docs) + custom <b>pipeline-status</b> server · Skills &amp; hook in <code>.claude/</code></p>
  </section>`,

  // 7 — demo
  `<section class="slide demo">
    <h2>Demo</h2>
    <div class="shots">
      <figure><img src="${img.frontend}" alt="dashboard"/><figcaption>Dashboard — run &amp; observe</figcaption></figure>
      <figure><img src="${img.mcp}" alt="mcp"/><figcaption>context7 + custom MCP calls</figcaption></figure>
    </div>
  </section>`,

  // 8 — lessons
  `<section class="slide">
    <h2>Lessons learned</h2>
    <ul class="checks">
      <li><b>Spec first paid off</b> — a locked envelope format made every stage a small pure function.</li>
      <li><b>context7 beat memory</b> — the MCP v1.x <code>registerTool</code> API differs from older samples.</li>
      <li><b>A generic stage runner</b> kept stages testable in isolation; one bus dir keyed by target.</li>
      <li><b>The coverage gate</b> as a hook makes “≥80% or no push” a hard, demoable guarantee.</li>
      <li><b>Decimal everywhere</b> — <code>0.1 + 0.2 = 0.30</code>, and settlement math stays exact.</li>
    </ul>
    <div class="by">Thank you — Volodymyr Kiryakov</div>
  </section>`,
];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: 1280px 720px; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #0d1117; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #e6edf3; }
  .slide { width: 1280px; height: 720px; padding: 64px 72px; page-break-after: always;
           position: relative; overflow: hidden; display: flex; flex-direction: column;
           background: radial-gradient(1200px 500px at 85% -10%, #14304d 0%, #0d1117 55%); }
  .slide:last-child { page-break-after: auto; }
  h1 { font-size: 58px; line-height: 1.05; margin: 8px 0 16px; }
  h2 { font-size: 40px; color: #58a6ff; margin-bottom: 26px; }
  h3 { font-size: 22px; margin-bottom: 6px; color: #7ee787; }
  .kicker { color: #58a6ff; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; font-size: 16px; }
  .title { justify-content: center; }
  .lede { font-size: 24px; color: #adbac7; max-width: 900px; margin-bottom: 40px; }
  .big { font-size: 26px; line-height: 1.5; color: #cdd9e5; max-width: 1050px; margin-bottom: 28px; }
  .by { font-size: 22px; margin-top: 26px; color: #e6edf3; }
  .stackline { position: absolute; bottom: 56px; left: 72px; color: #768390; font-size: 17px; }
  ul.checks { list-style: none; font-size: 24px; line-height: 2; }
  ul.checks li { padding-left: 40px; position: relative; }
  ul.checks li::before { content: "✔"; color: #3fb950; position: absolute; left: 0; }
  code { background: #161b22; padding: 2px 7px; border-radius: 5px; font-size: .85em; color: #79c0ff; font-family: ui-monospace, monospace; }
  pre.diagram { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 26px 30px;
                font-family: ui-monospace, monospace; font-size: 18px; line-height: 1.5; color: #adbac7; }
  .note { margin-top: 22px; font-size: 18px; color: #909dab; }
  table.stages { width: 100%; border-collapse: collapse; font-size: 21px; }
  table.stages th { text-align: left; color: #768390; font-size: 15px; text-transform: uppercase; padding: 8px 12px; border-bottom: 2px solid #30363d; }
  table.stages td { padding: 12px; border-bottom: 1px solid #21262d; vertical-align: top; }
  .set{color:#3fb950;font-weight:700}.flag{color:#d29922;font-weight:700}.rej{color:#f85149;font-weight:700}.hold{color:#a371f7;font-weight:700}
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 22px 24px; }
  .card p { font-size: 19px; color: #adbac7; }
  .shots { display: flex; gap: 26px; align-items: flex-start; }
  .shots figure { flex: 1; }
  .shots img { width: 100%; border: 1px solid #30363d; border-radius: 10px; max-height: 500px; object-fit: contain; object-position: top; background:#fff; }
  .shots figcaption { text-align: center; color: #909dab; font-size: 17px; margin-top: 10px; }
</style></head><body>
${slides.join("\n")}
</body></html>`;

writeFileSync(join(HERE, "..", "slides", "index.html"), html);
console.log("deck written to docs/slides/index.html");

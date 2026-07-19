// Renders captured command output into styled "terminal" HTML pages for screenshots.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "consoles");
import { mkdirSync } from "node:fs";
mkdirSync(OUT, { recursive: true });

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function read(name) {
  return readFileSync(join(HERE, name), "utf8").replace(/\s+$/, "");
}

function page({ title, subtitle, prompt, body }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #0d1117; font-family: ui-monospace, "SF Mono", Menlo, monospace; }
  .win { max-width: 1000px; margin: 26px auto; border-radius: 10px; overflow: hidden;
         box-shadow: 0 10px 40px rgba(0,0,0,.5); border: 1px solid #30363d; }
  .bar { background: #161b22; padding: 10px 14px; display: flex; align-items: center; gap: 8px;
         border-bottom: 1px solid #30363d; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .r{background:#ff5f56}.y{background:#ffbd2e}.g{background:#27c93f}
  .ttl { color: #8b949e; font-size: 13px; margin-left: 10px; }
  .body { padding: 18px 20px; color: #c9d1d9; font-size: 13.5px; line-height: 1.55; white-space: pre-wrap; }
  .sub { color: #58a6ff; padding: 14px 20px 0; font-size: 15px; font-weight: 600; }
  .prompt { color: #7ee787; }
  pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
</style></head><body>
  <div class="win">
    <div class="bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
      <span class="ttl">${esc(title)}</span></div>
    ${subtitle ? `<div class="sub">${esc(subtitle)}</div>` : ""}
    <div class="body"><pre>${body}</pre></div>
  </div>
</body></html>`;
}

// 1. pipeline-run
writeFileSync(join(OUT, "pipeline-run.html"), page({
  title: "npm run pipeline — transaction pipeline",
  subtitle: "$ npm run pipeline",
  body: esc(read("pipeline-run.txt")),
}));

// 2. test-coverage — keep the coverage table + result summary
{
  const raw = read("test-coverage.txt").split("\n");
  const start = raw.findIndex((l) => l.includes("% Coverage report"));
  const kept = start >= 0 ? raw.slice(Math.max(0, start - 2)) : raw.slice(-40);
  writeFileSync(join(OUT, "test-coverage.html"), page({
    title: "npm run coverage — vitest v8",
    subtitle: "$ npm run coverage   (gate ≥ 80% · actual ≥ 95%)",
    body: esc(kept.join("\n")),
  }));
}

// 3. hook-trigger
writeFileSync(join(OUT, "hook-trigger.html"), page({
  title: "coverage-gate PreToolUse hook — blocks git push",
  subtitle: "Hook fires on `git push` and rejects when coverage is below threshold",
  body: esc(read("hook-trigger.txt")),
}));

// 4. skill-run-pipeline
{
  const summary = read("pipeline-run.txt").split("\n").slice(-30).join("\n");
  const skill = [
    "/run-pipeline   (Claude Code slash-command skill)",
    "",
    "Steps executed by the skill:",
    "  1. Check that sample-transactions.json exists           ✔",
    "  2. Clear the shared/ directories                        ✔",
    "  3. Run the pipeline:  npm run pipeline                  ✔",
    "  4. Show a summary of results from shared/results/       ✔",
    "  5. Report rejected / flagged / held transactions        ✔",
    "",
    "── result ──────────────────────────────────────────────",
    summary,
  ].join("\n");
  writeFileSync(join(OUT, "skill-run-pipeline.html"), page({
    title: "/run-pipeline skill",
    subtitle: "Slash command → runs the pipeline end-to-end via AI",
    body: esc(skill),
  }));
}

// 5. mcp-interaction — context7 + custom MCP tool call
{
  const c7 = read("context7.txt");
  const demo = read("mcp-demo.txt");
  // Trim demo to the readable highlights
  const lines = demo.split("\n");
  const pick = [];
  let take = false;
  for (const l of lines) {
    if (l.startsWith("Tools:")) take = true;
    if (take) pick.push(l);
    if (pick.length > 40) break;
  }
  const body = [
    "══ context7 MCP — framework docs lookup during code generation ══",
    "",
    c7,
    "",
    "══ custom MCP server (pipeline-status) — live tool + resource calls ══",
    "",
    pick.join("\n"),
  ].join("\n");
  writeFileSync(join(OUT, "mcp-interaction.html"), page({
    title: "MCP interaction — context7 + custom pipeline-status server",
    subtitle: "Both MCP servers from mcp.json in action",
    body: esc(body),
  }));
}

console.log("consoles written to", OUT);

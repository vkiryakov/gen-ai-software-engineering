#!/usr/bin/env node
// Coverage gate: fails (exit 1) when total line coverage is below the threshold.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const THRESHOLD = Number(process.env.COVERAGE_MIN ?? 80);
const summaryPath = join(process.cwd(), "coverage", "coverage-summary.json");

let pct;
try {
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  pct = summary.total.lines.pct;
} catch {
  console.error(`\n❌ coverage gate: no coverage report at ${summaryPath}. Run \`npm run coverage\` first.`);
  process.exit(1);
}

if (pct < THRESHOLD) {
  console.error(`\n❌ coverage gate FAILED: line coverage ${pct}% < ${THRESHOLD}% — push blocked.`);
  process.exit(1);
}
console.log(`✅ coverage gate passed: line coverage ${pct}% ≥ ${THRESHOLD}%.`);
process.exit(0);

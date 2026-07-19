import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { clearDir, ensureDir, readEnvelopes, writeEnvelope } from "./pipeline/fs-utils.js";
import { makeEnvelope, type RawTransaction, type SharedDirs } from "./pipeline/types.js";
import { runValidator } from "./pipeline/validator.js";
import { runFraudDetector } from "./pipeline/fraud_detector.js";
import { runCompliance } from "./pipeline/compliance.js";
import { runSettlement } from "./pipeline/settlement.js";
import { buildSummary, writeSummary, type Summary } from "./pipeline/reporting.js";

const HERE = dirname(fileURLToPath(import.meta.url));

export async function setupDirs(base: string): Promise<SharedDirs> {
  const dirs: SharedDirs = {
    base,
    input: join(base, "input"),
    processing: join(base, "processing"),
    output: join(base, "output"),
    results: join(base, "results"),
  };
  for (const d of [dirs.input, dirs.processing, dirs.output, dirs.results]) {
    await ensureDir(d);
    await clearDir(d);
  }
  return dirs;
}

export async function seedInput(dirs: SharedDirs, txns: RawTransaction[]): Promise<void> {
  for (const t of txns) {
    await writeEnvelope(dirs.input, makeEnvelope("orchestrator", "validator", { ...t, status: "received" }));
  }
}

export async function runPipeline(base: string = join(HERE, "shared")): Promise<Summary> {
  const dirs = await setupDirs(base);
  const txns = JSON.parse(await readFile(join(HERE, "sample-transactions.json"), "utf8")) as RawTransaction[];
  await seedInput(dirs, txns);

  await runValidator(dirs);
  await runFraudDetector(dirs);
  await runCompliance(dirs);
  await runSettlement(dirs);

  const summary = buildSummary(await readEnvelopes(dirs.results));
  await writeSummary(dirs, summary);
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const summary = await runPipeline();
  console.log("\n=== Pipeline summary ===");
  console.log(JSON.stringify(summary, null, 2));
}

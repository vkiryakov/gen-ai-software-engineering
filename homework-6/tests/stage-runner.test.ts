import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureDir, readEnvelopes, writeEnvelope } from "../pipeline/fs-utils.js";
import { runStage } from "../pipeline/stage-runner.js";
import { makeEnvelope, type SharedDirs, type TxnData } from "../pipeline/types.js";

function dirs(base: string): SharedDirs {
  return { base, input: join(base, "input"), processing: join(base, "processing"),
    output: join(base, "output"), results: join(base, "results") };
}
const data: TxnData = {
  transaction_id: "TXN001", timestamp: "2026-03-16T09:00:00Z",
  source_account: "ACC-1001", destination_account: "ACC-2001", amount: "1500.00",
  currency: "USD", transaction_type: "transfer", description: "rent",
  metadata: { channel: "online", country: "US" }, status: "received",
};

let d: SharedDirs;
beforeEach(async () => {
  d = dirs(mkdtempSync(join(tmpdir(), "hw6-")));
  for (const p of [d.input, d.processing, d.output, d.results]) await ensureDir(p);
});

describe("runStage", () => {
  it("routes a passing record to output with the next target", async () => {
    await writeEnvelope(d.input, makeEnvelope("orchestrator", "validator", data));
    await runStage(d, "validator", d.input, (x) => ({ next: "fraud_detector", data: { ...x, status: "validated" } }));
    const out = await readEnvelopes(d.output);
    expect(out).toHaveLength(1);
    expect(out[0].target_stage).toBe("fraud_detector");
    expect(out[0].data.status).toBe("validated");
    expect(await readEnvelopes(d.input)).toHaveLength(0);
    expect(await readEnvelopes(d.processing)).toHaveLength(0);
  });
  it("routes a terminal record to results", async () => {
    await writeEnvelope(d.input, makeEnvelope("orchestrator", "validator", data));
    await runStage(d, "validator", d.input, (x) => ({ next: "results", data: { ...x, status: "rejected", reason: "bad" } }));
    const res = await readEnvelopes(d.results);
    expect(res[0].data.status).toBe("rejected");
    expect(await readEnvelopes(d.output)).toHaveLength(0);
  });
  it("only processes envelopes addressed to the stage", async () => {
    await writeEnvelope(d.output, makeEnvelope("validator", "compliance", data));
    await runStage(d, "fraud_detector", d.output, (x) => ({ next: "results", data: { ...x, status: "flagged" } }));
    expect(await readEnvelopes(d.results)).toHaveLength(0);
  });
});

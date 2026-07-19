import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runPipeline } from "../orchestrator.js";
import { getTransactionStatus, listPipelineResults } from "../mcp/queries.js";

let resultsDir: string;
beforeAll(async () => {
  const base = mkdtempSync(join(tmpdir(), "hw6-mcp-"));
  await runPipeline(base);
  resultsDir = join(base, "results");
});

describe("mcp queries", () => {
  it("returns the status of a known transaction", async () => {
    const r = await getTransactionStatus(resultsDir, "TXN006");
    expect(r.found).toBe(true);
    expect(r.status).toBe("rejected");
  });
  it("returns not-found for an unknown transaction", async () => {
    expect((await getTransactionStatus(resultsDir, "NOPE")).found).toBe(false);
  });
  it("lists all processed results with counts", async () => {
    const r = await listPipelineResults(resultsDir);
    expect(r.total).toBe(8);
    expect(r.transactions.length).toBe(8);
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runPipeline } from "../orchestrator.js";
import { readEnvelopes } from "../pipeline/fs-utils.js";
import type { Envelope } from "../pipeline/types.js";

describe("full pipeline (integration)", () => {
  let results: Envelope[];
  let base: string;
  beforeAll(async () => {
    base = mkdtempSync(join(tmpdir(), "hw6-int-"));
    await runPipeline(base);
    results = await readEnvelopes(join(base, "results"));
  });

  it("produces a terminal result for all 8 sample transactions", () => {
    const ids = results.map((e) => e.data.transaction_id).filter((id) => id.startsWith("TXN"));
    expect(new Set(ids).size).toBe(8);
  });
  it("rejects TXN006 (bad currency) and TXN007 (negative amount)", () => {
    const byId = Object.fromEntries(results.map((e) => [e.data.transaction_id, e.data]));
    expect(byId["TXN006"].status).toBe("rejected");
    expect(byId["TXN007"].status).toBe("rejected");
  });
  it("flags the high-value / structuring txns", () => {
    const byId = Object.fromEntries(results.map((e) => [e.data.transaction_id, e.data]));
    expect(byId["TXN002"].status).toBe("flagged");
    expect(byId["TXN003"].status).toBe("flagged");
    expect(byId["TXN005"].status).toBe("flagged");
  });
  it("settles the clean txns with a computed fee", () => {
    const byId = Object.fromEntries(results.map((e) => [e.data.transaction_id, e.data]));
    expect(byId["TXN001"].status).toBe("settled");
    expect(byId["TXN001"].fee).toBe("7.50");
    expect(byId["TXN008"].status).toBe("settled");
  });
  it("writes a summary.json", () => {
    const s = JSON.parse(readFileSync(join(base, "results", "summary.json"), "utf8"));
    expect(s.total).toBe(8);
    expect(s.by_status.settled).toBeGreaterThanOrEqual(3);
  });
});

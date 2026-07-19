import { describe, it, expect } from "vitest";
import { buildSummary } from "../pipeline/reporting.js";
import { makeEnvelope, type TxnData } from "../pipeline/types.js";

function res(id: string, status: TxnData["status"], reason?: string) {
  const data: TxnData = {
    transaction_id: id, timestamp: "2026-03-16T09:00:00Z", source_account: "ACC-1",
    destination_account: "ACC-2", amount: "100.00", currency: "USD",
    transaction_type: "transfer", description: "x",
    metadata: { channel: "online", country: "US" }, status, reason,
  };
  return makeEnvelope("settlement", "results", data);
}

describe("buildSummary", () => {
  it("aggregates counts by terminal status", () => {
    const s = buildSummary([
      res("T1", "settled"), res("T2", "settled"),
      res("T3", "flagged", "risk"), res("T4", "rejected", "bad currency"),
    ]);
    expect(s.total).toBe(4);
    expect(s.by_status.settled).toBe(2);
    expect(s.by_status.flagged).toBe(1);
    expect(s.by_status.rejected).toBe(1);
    expect(s.reasons.find((r) => r.transaction_id === "T4")?.reason).toMatch(/currency/);
  });
});

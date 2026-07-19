import { describe, it, expect } from "vitest";
import { scoreTransaction, fraudHandler } from "../pipeline/fraud_detector.js";
import type { TxnData } from "../pipeline/types.js";

const base: TxnData = {
  transaction_id: "T", timestamp: "2026-03-16T09:00:00Z", source_account: "ACC-1",
  destination_account: "ACC-2", amount: "1500.00", currency: "USD",
  transaction_type: "transfer", description: "x", metadata: { channel: "online", country: "US" },
  status: "validated",
};

describe("scoreTransaction", () => {
  it("scores a normal domestic transfer as low risk", () => {
    expect(scoreTransaction(base).risk_score).toBeLessThan(50);
  });
  it("flags a high-value transfer > $10k", () => {
    const r = scoreTransaction({ ...base, amount: "25000.00" });
    expect(r.risk_score).toBeGreaterThanOrEqual(50);
    expect(r.fraud_flags).toContain("HIGH_VALUE");
  });
  it("flags near-threshold structuring just under $10k", () => {
    const r = scoreTransaction({ ...base, amount: "9999.99" });
    expect(r.fraud_flags).toContain("STRUCTURING");
    expect(r.risk_score).toBeGreaterThanOrEqual(50);
  });
  it("adds risk for night-time cross-border but stays below flag alone", () => {
    const r = scoreTransaction({ ...base, amount: "500.00", currency: "EUR",
      timestamp: "2026-03-16T02:47:00Z", metadata: { channel: "api", country: "DE" } });
    expect(r.fraud_flags).toEqual(expect.arrayContaining(["NIGHT_TIME", "CROSS_BORDER"]));
    expect(r.risk_score).toBeLessThan(50);
  });
});

describe("fraudHandler", () => {
  it("routes flagged txns to results", () => {
    expect(fraudHandler({ ...base, amount: "25000.00" }).next).toBe("results");
  });
  it("routes cleared txns to compliance", () => {
    expect(fraudHandler(base).next).toBe("compliance");
  });
});

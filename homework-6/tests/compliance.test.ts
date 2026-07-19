import { describe, it, expect } from "vitest";
import { checkCompliance, complianceHandler } from "../pipeline/compliance.js";
import type { TxnData } from "../pipeline/types.js";

const base: TxnData = {
  transaction_id: "T", timestamp: "2026-03-16T09:00:00Z", source_account: "ACC-1",
  destination_account: "ACC-2", amount: "1500.00", currency: "USD",
  transaction_type: "transfer", description: "x", metadata: { channel: "online", country: "US" },
  status: "validated",
};

describe("checkCompliance", () => {
  it("clears a normal domestic transaction with no flags", () => {
    const r = checkCompliance(base);
    expect(r.status).toBe("cleared");
    expect(r.compliance_flags).toHaveLength(0);
  });
  it("adds CROSS_BORDER_REVIEW for foreign country but still clears", () => {
    const r = checkCompliance({ ...base, metadata: { channel: "api", country: "DE" } });
    expect(r.status).toBe("cleared");
    expect(r.compliance_flags).toContain("CROSS_BORDER_REVIEW");
  });
  it("adds CTR_REQUIRED above $10k", () => {
    expect(checkCompliance({ ...base, amount: "25000.00" }).compliance_flags).toContain("CTR_REQUIRED");
  });
  it("holds a sanctioned account", () => {
    const r = checkCompliance({ ...base, destination_account: "ACC-BLOCKED" });
    expect(r.status).toBe("hold");
    expect(r.compliance_flags).toContain("SANCTIONS_HIT");
  });
});

describe("complianceHandler", () => {
  it("routes cleared to settlement", () => {
    expect(complianceHandler(base).next).toBe("settlement");
  });
  it("routes hold to results", () => {
    expect(complianceHandler({ ...base, destination_account: "ACC-BLOCKED" }).next).toBe("results");
  });
});

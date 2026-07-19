import { describe, it, expect } from "vitest";
import { makeEnvelope, nowIso, type TxnData } from "../pipeline/types.js";

const sample: TxnData = {
  transaction_id: "TXN001", timestamp: "2026-03-16T09:00:00Z",
  source_account: "ACC-1001", destination_account: "ACC-2001",
  amount: "1500.00", currency: "USD", transaction_type: "transfer",
  description: "rent", metadata: { channel: "online", country: "US" },
  status: "received",
};

describe("types", () => {
  it("nowIso returns an ISO 8601 string", () => {
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
  it("makeEnvelope stamps a uuid and copies data", () => {
    const e = makeEnvelope("orchestrator", "validator", sample);
    expect(e.message_id).toMatch(/[0-9a-f-]{36}/);
    expect(e.target_stage).toBe("validator");
    expect(e.data.transaction_id).toBe("TXN001");
    expect(e.message_type).toBe("transaction");
  });
});

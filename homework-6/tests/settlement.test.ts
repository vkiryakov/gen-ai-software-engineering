import { describe, it, expect } from "vitest";
import { settle, settlementHandler } from "../pipeline/settlement.js";
import type { TxnData } from "../pipeline/types.js";

const base: TxnData = {
  transaction_id: "T", timestamp: "2026-03-16T09:00:00Z", source_account: "ACC-1",
  destination_account: "ACC-2", amount: "1500.00", currency: "USD",
  transaction_type: "transfer", description: "x", metadata: { channel: "online", country: "US" },
  status: "cleared",
};

describe("settle", () => {
  it("charges the transfer fee rate and computes net with HALF_UP", () => {
    const r = settle(base);
    expect(r.fee).toBe("7.50");        // 1500 * 0.005
    expect(r.net_amount).toBe("1492.50");
  });
  it("charges the wire fee rate", () => {
    const r = settle({ ...base, amount: "25000.00", transaction_type: "wire_transfer" });
    expect(r.fee).toBe("25.00");       // 25000 * 0.001
    expect(r.net_amount).toBe("24975.00");
  });
});

describe("settlementHandler", () => {
  it("settles and routes to results", () => {
    const out = settlementHandler(base);
    expect(out.next).toBe("results");
    expect(out.data.status).toBe("settled");
    expect(out.data.fee).toBe("7.50");
  });
});

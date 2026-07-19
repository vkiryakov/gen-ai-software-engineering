import { describe, it, expect } from "vitest";
import { validateTransaction, dryRunReport } from "../pipeline/validator.js";
import type { RawTransaction } from "../pipeline/types.js";

const base: RawTransaction = {
  transaction_id: "TXN001", timestamp: "2026-03-16T09:00:00Z",
  source_account: "ACC-1001", destination_account: "ACC-2001", amount: "1500.00",
  currency: "USD", transaction_type: "transfer", description: "rent",
  metadata: { channel: "online", country: "US" },
};

describe("validateTransaction", () => {
  it("accepts a well-formed USD transaction", () => {
    expect(validateTransaction(base)).toEqual({ ok: true, status: "validated" });
  });
  it("rejects a non-ISO-4217 currency", () => {
    const r = validateTransaction({ ...base, currency: "XYZ" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/currency/i);
  });
  it("rejects a non-positive amount", () => {
    const r = validateTransaction({ ...base, amount: "-100.00" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/amount/i);
  });
  it("rejects a missing required field", () => {
    const r = validateTransaction({ ...base, source_account: "" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/source_account/i);
  });
});

describe("dryRunReport", () => {
  it("counts valid and invalid", () => {
    const rep = dryRunReport([base, { ...base, transaction_id: "TXN006", currency: "XYZ" }]);
    expect(rep.total).toBe(2);
    expect(rep.valid).toBe(1);
    expect(rep.invalid).toBe(1);
    expect(rep.rows).toHaveLength(2);
  });
});

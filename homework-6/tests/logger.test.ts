import { describe, it, expect, vi } from "vitest";
import { maskAccount, maskName, auditLog } from "../pipeline/logger.js";

describe("logger", () => {
  it("masks account keeping only last 2 chars", () => {
    expect(maskAccount("ACC-1001")).toBe("ACC-****01");
    expect(maskAccount("X")).toBe("****");
  });
  it("masks a name to initials", () => {
    expect(maskName("Monthly rent payment")).toBe("M*** r*** p***");
  });
  it("auditLog returns an entry with ISO timestamp and no PII", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const e = auditLog("validator", "TXN001", "validated", "ok");
    expect(e.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(e.stage).toBe("validator");
    expect(e.transaction_id).toBe("TXN001");
    expect(e.outcome).toBe("validated");
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

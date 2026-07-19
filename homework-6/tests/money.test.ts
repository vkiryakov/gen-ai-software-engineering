import { describe, it, expect } from "vitest";
import { isPositiveAmount, addMoney, mulMoney, roundCurrency } from "../pipeline/money.js";

describe("money", () => {
  it("accepts a positive decimal string", () => {
    expect(isPositiveAmount("1500.00")).toBe(true);
  });
  it("rejects zero, negatives, and garbage", () => {
    expect(isPositiveAmount("0")).toBe(false);
    expect(isPositiveAmount("-100.00")).toBe(false);
    expect(isPositiveAmount("abc")).toBe(false);
    expect(isPositiveAmount("")).toBe(false);
  });
  it("adds without float error", () => {
    expect(addMoney("0.1", "0.2")).toBe("0.30");
  });
  it("multiplies and rounds HALF_UP to 2dp", () => {
    expect(mulMoney("1500.00", "0.005")).toBe("7.50");
    expect(roundCurrency("2.555")).toBe("2.56");
  });
});

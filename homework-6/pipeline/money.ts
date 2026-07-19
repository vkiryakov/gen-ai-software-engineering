import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(v: string | number): Decimal {
  return new Decimal(v);
}

export function isPositiveAmount(v: string): boolean {
  if (v === undefined || v === null || v === "") return false;
  try {
    const d = new Decimal(v);
    return d.isFinite() && d.greaterThan(0);
  } catch {
    return false;
  }
}

export function roundCurrency(v: string | number | Decimal): string {
  return new Decimal(v).toFixed(2);
}

export function addMoney(a: string | number, b: string | number): string {
  return new Decimal(a).plus(b).toFixed(2);
}

export function mulMoney(a: string | number, factor: string | number): string {
  return new Decimal(a).mul(factor).toFixed(2);
}

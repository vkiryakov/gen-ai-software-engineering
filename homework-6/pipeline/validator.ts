import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { isPositiveAmount } from "./money.js";
import { runStage, type StageHandler } from "./stage-runner.js";
import type { RawTransaction, SharedDirs, TxnData } from "./types.js";

export const ISO_4217 = new Set([
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "SEK", "NOK",
  "DKK", "SGD", "HKD", "CNY", "INR", "BRL", "ZAR", "MXN", "PLN", "AED",
]);

const REQUIRED: (keyof RawTransaction)[] = [
  "transaction_id", "timestamp", "source_account", "destination_account",
  "amount", "currency", "transaction_type",
];

export interface ValidationResult {
  ok: boolean;
  status: "validated" | "rejected";
  reason?: string;
}

export function validateTransaction(data: RawTransaction): ValidationResult {
  for (const field of REQUIRED) {
    if (!data[field] || String(data[field]).trim() === "") {
      return { ok: false, status: "rejected", reason: `missing required field: ${field}` };
    }
  }
  if (!isPositiveAmount(data.amount)) {
    return { ok: false, status: "rejected", reason: `invalid amount: ${data.amount} (must be > 0)` };
  }
  if (!ISO_4217.has(data.currency)) {
    return { ok: false, status: "rejected", reason: `unsupported currency: ${data.currency} (not ISO 4217)` };
  }
  return { ok: true, status: "validated" };
}

export const validatorHandler: StageHandler = (data) => {
  const r = validateTransaction(data);
  if (!r.ok) return { next: "results", data: { ...data, status: "rejected", reason: r.reason } };
  return { next: "fraud_detector", data: { ...data, status: "validated" } };
};

export async function runValidator(dirs: SharedDirs): Promise<void> {
  await runStage(dirs, "validator", dirs.input, validatorHandler);
}

export interface DryRunReport {
  total: number;
  valid: number;
  invalid: number;
  rows: { transaction_id: string; ok: boolean; reason?: string }[];
}

export function dryRunReport(txns: RawTransaction[]): DryRunReport {
  const rows = txns.map((t) => {
    const r = validateTransaction(t);
    return { transaction_id: t.transaction_id, ok: r.ok, reason: r.reason };
  });
  return {
    total: rows.length,
    valid: rows.filter((r) => r.ok).length,
    invalid: rows.filter((r) => !r.ok).length,
    rows,
  };
}

// CLI: tsx pipeline/validator.ts --dry-run
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes("--dry-run")) {
  const txns = JSON.parse(
    await readFile(new URL("../sample-transactions.json", import.meta.url), "utf8"),
  ) as RawTransaction[];
  const rep = dryRunReport(txns);
  console.log(`\nDry-run validation — total=${rep.total} valid=${rep.valid} invalid=${rep.invalid}\n`);
  console.table(rep.rows);
}

import { nowIso } from "./types.js";

export interface AuditEntry {
  timestamp: string;
  stage: string;
  transaction_id: string;
  outcome: string;
  detail?: string;
}

export function maskAccount(acc: string): string {
  if (!acc || acc.length <= 2) return "****";
  const prefixMatch = acc.match(/^[A-Za-z]+-/);
  const prefix = prefixMatch ? prefixMatch[0] : "";
  const last2 = acc.slice(-2);
  return `${prefix}****${last2}`;
}

export function maskName(s: string): string {
  if (!s) return "";
  return s
    .split(/\s+/)
    .map((w) => (w ? `${w[0]}***` : ""))
    .join(" ")
    .trim();
}

export function auditLog(
  stage: string,
  transaction_id: string,
  outcome: string,
  detail?: string,
): AuditEntry {
  const entry: AuditEntry = { timestamp: nowIso(), stage, transaction_id, outcome, detail };
  console.log(
    `[${entry.timestamp}] stage=${stage} txn=${transaction_id} outcome=${outcome}` +
      (detail ? ` detail=${detail}` : ""),
  );
  return entry;
}

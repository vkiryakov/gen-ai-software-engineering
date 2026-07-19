import { randomUUID } from "node:crypto";

export type Stage = "validator" | "fraud_detector" | "compliance" | "settlement" | "reporting";
export type Target = Stage | "results";

export type TxnStatus =
  | "received" | "validated" | "rejected"
  | "flagged" | "cleared" | "hold" | "settled";

export interface RawTransaction {
  transaction_id: string;
  timestamp: string;
  source_account: string;
  destination_account: string;
  amount: string;
  currency: string;
  transaction_type: string;
  description: string;
  metadata: { channel: string; country: string };
}

export interface TxnData extends RawTransaction {
  status: TxnStatus;
  reason?: string;
  risk_score?: number;
  fraud_flags?: string[];
  compliance_flags?: string[];
  fee?: string;
  net_amount?: string;
}

export interface Envelope {
  message_id: string;
  timestamp: string;
  source_stage: Stage | "orchestrator";
  target_stage: Target;
  message_type: "transaction";
  data: TxnData;
}

export interface SharedDirs {
  base: string;
  input: string;
  processing: string;
  output: string;
  results: string;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function makeEnvelope(
  source: Envelope["source_stage"],
  target: Target,
  data: TxnData,
): Envelope {
  return {
    message_id: randomUUID(),
    timestamp: nowIso(),
    source_stage: source,
    target_stage: target,
    message_type: "transaction",
    data,
  };
}

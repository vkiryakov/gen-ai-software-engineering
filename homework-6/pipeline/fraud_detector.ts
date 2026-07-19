import { toDecimal } from "./money.js";
import { runStage, type StageHandler } from "./stage-runner.js";
import type { SharedDirs, TxnData } from "./types.js";

export const FLAG_THRESHOLD = 50;
const BASE_COUNTRY = "US";
const HIGH_VALUE = toDecimal("10000");
const STRUCTURING_FLOOR = toDecimal("9000");

export interface FraudResult {
  risk_score: number;
  fraud_flags: string[];
}

export function scoreTransaction(data: TxnData): FraudResult {
  const flags: string[] = [];
  let score = 0;
  const amount = toDecimal(data.amount);

  if (amount.greaterThan(HIGH_VALUE)) {
    score += 60;
    flags.push("HIGH_VALUE");
  } else if (amount.greaterThanOrEqualTo(STRUCTURING_FLOOR) && amount.lessThanOrEqualTo(HIGH_VALUE)) {
    score += 55;
    flags.push("STRUCTURING");
  }

  const hour = new Date(data.timestamp).getUTCHours();
  if (hour >= 0 && hour < 6) {
    score += 20;
    flags.push("NIGHT_TIME");
  }
  if (data.metadata.country !== BASE_COUNTRY) {
    score += 20;
    flags.push("CROSS_BORDER");
  }

  return { risk_score: Math.min(score, 100), fraud_flags: flags };
}

export const fraudHandler: StageHandler = (data) => {
  const { risk_score, fraud_flags } = scoreTransaction(data);
  const annotated: TxnData = { ...data, risk_score, fraud_flags };
  if (risk_score >= FLAG_THRESHOLD) {
    return {
      next: "results",
      data: { ...annotated, status: "flagged", reason: `risk ${risk_score}: ${fraud_flags.join(",")}` },
    };
  }
  return { next: "compliance", data: annotated };
};

export async function runFraudDetector(dirs: SharedDirs): Promise<void> {
  await runStage(dirs, "fraud_detector", dirs.output, fraudHandler);
}

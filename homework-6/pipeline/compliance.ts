import { toDecimal } from "./money.js";
import { runStage, type StageHandler } from "./stage-runner.js";
import type { SharedDirs, TxnData } from "./types.js";

export const SANCTIONED = new Set(["ACC-BLOCKED", "ACC-9000"]);
const BASE_COUNTRY = "US";
const CTR_THRESHOLD = toDecimal("10000");

export interface ComplianceResult {
  status: "cleared" | "hold";
  compliance_flags: string[];
}

export function checkCompliance(data: TxnData): ComplianceResult {
  const flags: string[] = [];
  if (toDecimal(data.amount).greaterThan(CTR_THRESHOLD)) flags.push("CTR_REQUIRED");
  if (data.metadata.country !== BASE_COUNTRY) flags.push("CROSS_BORDER_REVIEW");
  if (SANCTIONED.has(data.source_account) || SANCTIONED.has(data.destination_account)) {
    flags.push("SANCTIONS_HIT");
    return { status: "hold", compliance_flags: flags };
  }
  return { status: "cleared", compliance_flags: flags };
}

export const complianceHandler: StageHandler = (data) => {
  const { status, compliance_flags } = checkCompliance(data);
  const annotated: TxnData = { ...data, compliance_flags };
  if (status === "hold") {
    return {
      next: "results",
      data: { ...annotated, status: "hold", reason: `compliance hold: ${compliance_flags.join(",")}` },
    };
  }
  return { next: "settlement", data: { ...annotated, status: "cleared" } };
};

export async function runCompliance(dirs: SharedDirs): Promise<void> {
  await runStage(dirs, "compliance", dirs.output, complianceHandler);
}

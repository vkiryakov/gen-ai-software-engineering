import { mulMoney, roundCurrency, toDecimal } from "./money.js";
import { runStage, type StageHandler } from "./stage-runner.js";
import type { SharedDirs, TxnData } from "./types.js";

export const FEE_RATES: Record<string, string> = {
  wire_transfer: "0.001",
  transfer: "0.005",
  refund: "0",
};
const DEFAULT_RATE = "0.005";

export interface SettlementResult {
  fee: string;
  net_amount: string;
}

export function settle(data: TxnData): SettlementResult {
  const rate = FEE_RATES[data.transaction_type] ?? DEFAULT_RATE;
  const fee = mulMoney(data.amount, rate);
  const net = roundCurrency(toDecimal(data.amount).minus(fee));
  return { fee, net_amount: net };
}

export const settlementHandler: StageHandler = (data) => {
  const { fee, net_amount } = settle(data);
  return { next: "results", data: { ...data, status: "settled", fee, net_amount } };
};

export async function runSettlement(dirs: SharedDirs): Promise<void> {
  await runStage(dirs, "settlement", dirs.output, settlementHandler);
}

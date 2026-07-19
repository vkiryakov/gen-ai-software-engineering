import { join } from "node:path";
import { readEnvelopes } from "../pipeline/fs-utils.js";

const DEFAULT_RESULTS = join(process.cwd(), "shared", "results");

export async function getTransactionStatus(resultsDir: string = DEFAULT_RESULTS, id: string) {
  const envs = await readEnvelopes(resultsDir);
  const match = envs.find((e) => e.data.transaction_id === id);
  if (!match) return { found: false, transaction_id: id };
  return {
    found: true,
    transaction_id: id,
    status: match.data.status,
    reason: match.data.reason,
    risk_score: match.data.risk_score,
    fee: match.data.fee,
    net_amount: match.data.net_amount,
  };
}

export async function listPipelineResults(resultsDir: string = DEFAULT_RESULTS) {
  const envs = await readEnvelopes(resultsDir);
  const by_status: Record<string, number> = {};
  const transactions = envs.map((e) => {
    by_status[e.data.status] = (by_status[e.data.status] ?? 0) + 1;
    return { transaction_id: e.data.transaction_id, status: e.data.status, reason: e.data.reason };
  });
  return { total: transactions.length, by_status, transactions };
}

export async function pipelineSummaryText(resultsDir: string = DEFAULT_RESULTS): Promise<string> {
  const { total, by_status } = await listPipelineResults(resultsDir);
  const lines = Object.entries(by_status).map(([k, v]) => `  ${k}: ${v}`);
  return `Pipeline summary — ${total} transactions processed\n${lines.join("\n")}`;
}

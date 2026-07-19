import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir } from "./fs-utils.js";
import { nowIso, type Envelope, type SharedDirs, type TxnStatus } from "./types.js";

export interface Summary {
  run_at: string;
  total: number;
  by_status: Record<string, number>;
  reasons: { transaction_id: string; status: TxnStatus; reason?: string }[];
}

export function buildSummary(results: Envelope[]): Summary {
  const by_status: Record<string, number> = {};
  const reasons: Summary["reasons"] = [];
  for (const e of results) {
    const s = e.data.status;
    by_status[s] = (by_status[s] ?? 0) + 1;
    if (s !== "settled") {
      reasons.push({ transaction_id: e.data.transaction_id, status: s, reason: e.data.reason });
    }
  }
  return { run_at: nowIso(), total: results.length, by_status, reasons };
}

export async function writeSummary(dirs: SharedDirs, summary: Summary): Promise<string> {
  await ensureDir(dirs.results);
  const path = join(dirs.results, "summary.json");
  await writeFile(path, JSON.stringify(summary, null, 2));
  return path;
}

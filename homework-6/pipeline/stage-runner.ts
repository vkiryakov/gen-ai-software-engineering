import { auditLog } from "./logger.js";
import { readEnvelopes, writeEnvelope, removeEnvelope } from "./fs-utils.js";
import { makeEnvelope, type SharedDirs, type Stage, type Target, type TxnData } from "./types.js";

export type StageHandler = (data: TxnData) => { next: Target; data: TxnData };

export async function runStage(
  dirs: SharedDirs,
  stage: Stage,
  sourceDir: string,
  handler: StageHandler,
): Promise<void> {
  const pending = (await readEnvelopes(sourceDir)).filter((e) => e.target_stage === stage);
  for (const env of pending) {
    await writeEnvelope(dirs.processing, { ...env, source_stage: stage });
    const { next, data } = handler(env.data);
    await removeEnvelope(sourceDir, env.data.transaction_id);
    const out = makeEnvelope(stage, next, data);
    await writeEnvelope(next === "results" ? dirs.results : dirs.output, out);
    await removeEnvelope(dirs.processing, env.data.transaction_id);
    auditLog(stage, data.transaction_id, data.status, data.reason);
  }
}

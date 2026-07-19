import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import type { Envelope } from "./types.js";

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function clearDir(dir: string): Promise<void> {
  await ensureDir(dir);
  const files = await readdir(dir);
  await Promise.all(
    files.filter((f) => f.endsWith(".json")).map((f) => rm(join(dir, f))),
  );
}

export async function readEnvelopes(dir: string): Promise<Envelope[]> {
  await ensureDir(dir);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json") && f !== "summary.json");
  const out: Envelope[] = [];
  for (const f of files) {
    out.push(JSON.parse(await readFile(join(dir, f), "utf8")) as Envelope);
  }
  return out;
}

export async function writeEnvelope(dir: string, env: Envelope): Promise<void> {
  await ensureDir(dir);
  await writeFile(join(dir, `${env.data.transaction_id}.json`), JSON.stringify(env, null, 2));
}

export async function removeEnvelope(dir: string, txnId: string): Promise<void> {
  await rm(join(dir, `${txnId}.json`), { force: true });
}

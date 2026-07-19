export interface ResultRow { transaction_id: string; status: string; reason?: string }
export interface ResultsResponse { total: number; by_status: Record<string, number>; transactions: ResultRow[] }

export async function runPipeline(): Promise<void> {
  await fetch("/api/run", { method: "POST" });
}

export async function fetchResults(): Promise<ResultsResponse> {
  const r = await fetch("/api/results");
  return r.json();
}

import { useEffect, useState } from "react";
import { fetchResults, runPipeline, type ResultsResponse } from "./api";

const STATUS_COLORS: Record<string, string> = {
  settled: "#1a7f37", flagged: "#9a6700", rejected: "#cf222e", hold: "#8250df",
};

export default function App() {
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setData(await fetchResults());
  }
  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  async function onRun() {
    setBusy(true);
    try {
      await runPipeline();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <header>
        <h1>🏦 Transaction Pipeline Dashboard</h1>
        <button onClick={onRun} disabled={busy}>
          {busy ? "Running…" : "▶ Run pipeline"}
        </button>
      </header>

      <section className="counters">
        {data &&
          Object.entries(data.by_status).map(([k, v]) => (
            <div key={k} className="counter" style={{ borderColor: STATUS_COLORS[k] ?? "#999" }}>
              <span className="count">{v}</span>
              <span className="label">{k}</span>
            </div>
          ))}
        {data && (
          <div className="counter">
            <span className="count">{data.total}</span>
            <span className="label">total</span>
          </div>
        )}
      </section>

      <table>
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Status</th>
            <th>Reason / flags</th>
          </tr>
        </thead>
        <tbody>
          {data?.transactions.map((t) => (
            <tr key={t.transaction_id}>
              <td>{t.transaction_id}</td>
              <td>
                <span className="badge" style={{ background: STATUS_COLORS[t.status] ?? "#666" }}>
                  {t.status}
                </span>
              </td>
              <td>{t.reason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data && <p>Loading… run the pipeline to populate results.</p>}
    </main>
  );
}

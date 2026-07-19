import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPipeline } from "../orchestrator.js";
import { listPipelineResults } from "../mcp/queries.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const SHARED = join(HERE, "..", "shared");
const RESULTS = join(SHARED, "results");
const app = express();

app.post("/api/run", async (_req, res) => {
  const summary = await runPipeline(SHARED);
  res.json({ summary });
});

app.get("/api/results", async (_req, res) => {
  res.json(await listPipelineResults(RESULTS));
});

app.get("/api/summary", async (_req, res) => {
  res.json(await listPipelineResults(RESULTS));
});

// Serve the built SPA if present
app.use(express.static(join(HERE, "dist")));

const PORT = Number(process.env.PORT ?? 8787);
app.listen(PORT, () => console.log(`API + dashboard on http://localhost:${PORT}`));

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getTransactionStatus, listPipelineResults, pipelineSummaryText } from "./queries.js";

const server = new McpServer({ name: "pipeline-status", version: "1.0.0" });

server.registerTool(
  "get_transaction_status",
  {
    title: "Get transaction status",
    description: "Return the current pipeline status of a transaction by id, from shared/results/.",
    inputSchema: { transaction_id: z.string().describe("e.g. TXN001") },
  },
  async ({ transaction_id }) => {
    const r = await getTransactionStatus(undefined, transaction_id);
    return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
  },
);

server.registerTool(
  "list_pipeline_results",
  {
    title: "List pipeline results",
    description: "Return a summary of all processed transactions and status counts.",
    inputSchema: {},
  },
  async () => {
    const r = await listPipelineResults();
    return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }] };
  },
);

server.registerResource(
  "summary",
  "pipeline://summary",
  { title: "Pipeline summary", description: "Latest pipeline run summary as text", mimeType: "text/plain" },
  async (uri) => ({ contents: [{ uri: uri.href, text: await pipelineSummaryText() }] }),
);

const transport = new StdioServerTransport();
await server.connect(transport);

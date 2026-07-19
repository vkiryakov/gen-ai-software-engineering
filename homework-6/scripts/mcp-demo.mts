// Demo client for the custom pipeline-status MCP server.
// Spawns mcp/server.ts over stdio, lists tools/resources, and calls each.
// Run from the homework-6 dir: npx tsx scripts/mcp-demo.mts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "tsx", "mcp/server.ts"],
  cwd: process.cwd(),
});
const client = new Client({ name: "pipeline-demo-client", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("Tools:", tools.tools.map((t) => t.name).join(", "));

console.log("\n> list_pipeline_results");
const list = await client.callTool({ name: "list_pipeline_results", arguments: {} });
console.log((list.content as { text: string }[])[0].text);

console.log("\n> get_transaction_status { transaction_id: 'TXN002' }");
const one = await client.callTool({ name: "get_transaction_status", arguments: { transaction_id: "TXN002" } });
console.log((one.content as { text: string }[])[0].text);

const resList = await client.listResources();
console.log("\nResources:", resList.resources.map((r) => r.uri).join(", "));
console.log("> read pipeline://summary");
const res = await client.readResource({ uri: "pipeline://summary" });
console.log((res.contents as { text: string }[])[0].text);

await client.close();

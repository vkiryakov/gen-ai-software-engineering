# Research Notes — context7 queries (Agent 2)

These are the context7 lookups made **during code generation** to confirm the current APIs of
the two libraries this pipeline depends on most. Both results were applied directly to the code.

## Query 1: MCP server in TypeScript (tools, resources, stdio)

- **Search:** "Model Context Protocol TypeScript SDK — build a server with stdio transport, register a tool with a zod input schema, register a resource with a fixed URI returning text"
- **context7 library ID:** `/modelcontextprotocol/typescript-sdk`
- **Applied:** confirmed the v1.x server API used in [`mcp/server.ts`](mcp/server.ts):
  - `new McpServer({ name, version })` from `@modelcontextprotocol/sdk/server/mcp.js`.
  - `server.registerTool(name, { title, description, inputSchema: { transaction_id: z.string() } }, handler)` —
    `inputSchema` is a **zod raw shape**, and the handler returns `{ content: [{ type: "text", text }] }`.
  - `server.registerResource(name, "pipeline://summary", { mimeType: "text/plain" }, async (uri) => ({ contents: [{ uri: uri.href, text }] }))`.
  - `new StdioServerTransport()` + `await server.connect(transport)` for the stdio transport.
  - Verified against the installed SDK (`v1.29.0`) with a real stdio client
    ([`scripts/mcp-demo.mts`](scripts/mcp-demo.mts)).

## Query 2: decimal / monetary arithmetic in JavaScript

- **Search:** "decimal.js — set rounding mode ROUND_HALF_UP, toFixed for currency, add and multiply Decimal values"
- **context7 library ID:** `/mikemcl/decimal.js`
- **Applied:** shaped [`pipeline/money.ts`](pipeline/money.ts):
  - `Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })` — the documented
    "financial calculations" configuration (precision 28, HALF_UP).
  - `.plus()` / `.mul()` for exact addition/multiplication (no float drift: `0.1 + 0.2 → "0.30"`).
  - `.toFixed(2)` for fixed-point currency formatting — used for `fee` and `net_amount` in
    [`pipeline/settlement.ts`](pipeline/settlement.ts) (e.g. `1500.00 × 0.005 = "7.50"`).

## (Bonus) Query 3: what these confirmed vs. training knowledge

Both lookups mattered: the MCP SDK's `registerTool`/`registerResource` API (v1.x) differs from
older `server.tool(...)` examples, and decimal.js's recommended financial config (precision 28 +
ROUND_HALF_UP) is exactly what the settlement math needs. Pulling current docs avoided guessing
a stale API.

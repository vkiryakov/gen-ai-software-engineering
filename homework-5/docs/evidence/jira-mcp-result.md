# Evidence — Jira / Atlassian MCP  ⚠️ TEMPLATE — fill in from your IDE

**Server:** Atlassian Remote MCP Server (SSE + OAuth) — `https://mcp.atlassian.com/v1/sse`.

This request needs **interactive OAuth**, which cannot run in a non-interactive session.
Do it in your IDE: run `/mcp` → authorize `atlassian`, then make the request below and
paste the (sanitized) result here.

## Request

> "Give me the tickets of the last 5 bugs on `<PROJECT>`."

Equivalent JQL the MCP runs:

```jql
project = "<PROJECT>" AND issuetype = Bug ORDER BY created DESC
```
(`maxResults = 5`)

## Response — sanitized (ticket keys only, no sensitive content)

Replace the placeholders with your real ticket keys:

| # | Ticket key | Created (date only) | Status |
|---|------------|---------------------|--------|
| 1 | `PROJ-###` |                     |        |
| 2 | `PROJ-###` |                     |        |
| 3 | `PROJ-###` |                     |        |
| 4 | `PROJ-###` |                     |        |
| 5 | `PROJ-###` |                     |        |

> Per the task: **do not** include summaries/descriptions or any sensitive data — ticket
> numbers are enough to represent a working response.

**Screenshot to capture (`docs/screenshots/jira-or-notion-mcp-result.png`):** screenshot
the request + response in Claude Code (blur/redact any sensitive text).

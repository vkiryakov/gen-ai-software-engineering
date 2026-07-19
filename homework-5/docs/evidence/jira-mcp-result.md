# Evidence — Jira / Atlassian MCP

**Server:** Atlassian Remote MCP Server (streamable HTTP + OAuth) — `https://mcp.atlassian.com/v1/mcp`.
**Interaction:** the required "last 5 bugs" request, run live in the IDE after OAuth.
Tool called: `Atlassian [searchJiraIssuesUsingJql]`.

## Request

> "Give me the tickets of the last 5 bugs on Lovespace."

Equivalent JQL the MCP ran:

```jql
project = "LS" AND issuetype = Bug ORDER BY created DESC
```
(`maxResults = 5`)

## Response — sanitized (ticket keys only, no sensitive content)

Per the task, only ticket numbers are shown; summaries/descriptions are intentionally omitted.

| # | Ticket key | Status | Created |
|---|------------|--------|---------|
| 1 | `LS-2243` | In Progress | 2026-05-15 |
| 2 | `LS-2212` | Backlog | 2026-05-15 |
| 3 | `LS-2211` | Backlog | 2026-05-15 |
| 4 | `LS-2208` | Backlog | 2026-05-15 |
| 5 | `LS-2192` | Done | 2026-05-15 |

Screenshot: [`docs/screenshots/jira-or-notion-mcp-result.png`](../screenshots/jira-or-notion-mcp-result.png)
(summary/assignee columns should be redacted there before committing to a public repo).

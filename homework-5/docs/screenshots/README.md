# Screenshots checklist

Drop 4 PNG files in this folder. Each shows an MCP call **request + result** in your IDE
(Claude Code). The exact prompts and the real text output are in
[`../evidence/`](../evidence/) — use them to reproduce each call, then screenshot it.

| File | Server | Prompt to run in the IDE | Reference output |
|------|--------|--------------------------|------------------|
| `github-mcp-result.png` | GitHub | "Use the GitHub MCP to list the last 5 commits of vkiryakov/gen-ai-software-engineering." | [github-mcp-result.md](../evidence/github-mcp-result.md) |
| `filesystem-mcp-result.png` | Filesystem | "Use the Filesystem MCP to list the files in the homework-5 directory." | [filesystem-mcp-result.md](../evidence/filesystem-mcp-result.md) |
| `jira-or-notion-mcp-result.png` | Jira | "Give me the tickets of the last 5 bugs on `<PROJECT>`." | [jira-mcp-result.md](../evidence/jira-mcp-result.md) |
| `custom-mcp-read-tool-result.png` | Custom | "Use the custom-lorem MCP `read` tool with word_count 5." | [custom-mcp-read-tool-result.md](../evidence/custom-mcp-read-tool-result.md) |

### Tips
- Show the **tool call** (name + arguments) and the **result** in the same shot.
- For the Jira shot, redact/blur any sensitive text — ticket keys are enough.
- `/mcp` in Claude Code should list all four servers as **connected** — a screenshot of
  that is a nice optional extra.

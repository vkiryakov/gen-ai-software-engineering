# Screenshots

Each PNG shows one MCP call (**request + result**) captured in Claude Code. The matching
reference text output is in [`../evidence/`](../evidence/).

| File | Server | Tool call shown | Reference |
|------|--------|-----------------|-----------|
| `github-mcp-result.png` | GitHub | `GitHub [list_commits]` — last 5 commits | [github-mcp-result.md](../evidence/github-mcp-result.md) |
| `filesystem-mcp-result.png` | Filesystem | `Filesystem [list_directory]` — files in `homework-5/` | [filesystem-mcp-result.md](../evidence/filesystem-mcp-result.md) |
| `jira-or-notion-mcp-result.png` | Jira | `Atlassian [searchJiraIssuesUsingJql]` — last 5 bugs | [jira-mcp-result.md](../evidence/jira-mcp-result.md) |
| `custom-mcp-read-tool-result.png` | Custom | `Custom-lorem [read]` — `word_count=5` | [custom-mcp-read-tool-result.md](../evidence/custom-mcp-read-tool-result.md) |

### Bonus (extra Jira MCP demonstrations)

| File | Shows |
|------|-------|
| `jira-mcp-bonus-create-ticket.png` | creating a Jira ticket via the Atlassian MCP |
| `jira-mcp-bonus-comment.png` | adding a comment to that ticket via the MCP |

> **Privacy note:** in `jira-or-notion-mcp-result.png` the **Summary** and **Assignee**
> columns (and the assignee mention in the notes) are redacted — per the task, only the
> ticket keys (`LS-####`) are shown. This repo is public.

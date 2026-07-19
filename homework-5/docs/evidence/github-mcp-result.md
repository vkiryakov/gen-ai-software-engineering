# Evidence — GitHub MCP

**Server:** `@modelcontextprotocol/server-github` (stdio, launched via `npx`).
**Interaction:** listed the 5 most recent commits of
`vkiryakov/gen-ai-software-engineering` via the `list_commits` tool.
Captured live in this session — the call returned real GitHub API data (auth OK).

## Request

```
tool: list_commits
args: { owner: "vkiryakov", repo: "gen-ai-software-engineering", perPage: 5 }
```

## Response (trimmed to the relevant fields)

| # | SHA (short) | Date (UTC) | Author | Message |
|---|-------------|------------|--------|---------|
| 1 | `666f23a` | 2026-07-12 19:14 | vkiryakov | feat: implement ticket management system with modal for creating/editing tickets, list view with filtering, and mock API for backend interactions |
| 2 | `3f0ada8` | 2026-07-12 18:53 | vkiryakov | fix(hw2): build deps before dev, declare PORT, drop generator boilerplate |
| 3 | `8ed75c9` | 2026-07-12 18:42 | vkiryakov | docs(hw2): describe monorepo structure and commands in README |
| 4 | `1466d14` | 2026-07-12 18:34 | vkiryakov | fix(hw2): track apps/web/.env.example (unignore in generated .gitignore) |
| 5 | `648b9c3` | 2026-07-12 18:33 | vkiryakov | feat(hw2): add Next.js web app with API status page |

Each item also carried `html_url`, e.g.
`https://github.com/vkiryakov/gen-ai-software-engineering/commit/666f23a...`.

**Screenshot to capture (`docs/screenshots/github-mcp-result.png`):** in Claude Code,
ask *"Use the GitHub MCP to list the last 5 commits of vkiryakov/gen-ai-software-engineering"*
and screenshot the tool call + result.

# Homework 5 — MCP Servers Design

**Date:** 2026-07-19
**Author:** Volodymyr Kiryakov
**Status:** Approved (conversational)

## Goal

Configure three external MCP servers (GitHub, Filesystem, Jira/Atlassian) and build one
custom FastMCP server, with reproducible config, docs, and evidence of working calls.

## Environmental constraints

- Session is **non-interactive**: OAuth-based connectors (Atlassian) cannot be authorized
  here. The live "last 5 bugs" query + its screenshot are the user's step in their IDE.
- Screenshots (`.png`) are inherently a GUI/IDE action — cannot be generated from a CLI.
  Mitigation: capture **real text output** as `docs/evidence/*.md` and give a precise
  4-PNG checklist in `docs/screenshots/README.md`.
- GitHub MCP (`@modelcontextprotocol/server-github`) is already connected in this session
  → Task 1 is demonstrated live and its output captured.
- Python 3.14 + `uv` + `npx` available → custom server and filesystem server verified live.

## Decisions

- **Task 3 provider:** Jira (Atlassian Remote MCP, OAuth).
- **Evidence mode:** real captured output + screenshot checklist.
- **Dependency files:** ship both `pyproject.toml` (uv) and `requirements.txt` (pip); both
  pin `fastmcp`.
- **Custom server transport:** stdio (`mcp.run()`), launched by the MCP client.

## Deliverable layout

```
homework-5/
├── README.md                 # 4 servers, Resources-vs-Tools explanation, author
├── HOWTORUN.md               # install / run / connect / test + per-server setup
├── mcp.json                  # github, filesystem, atlassian, custom-lorem
├── custom-mcp-server/
│   ├── server.py             # FastMCP: resource lorem://ipsum[/{word_count}] + tool read()
│   ├── lorem-ipsum.md        # ~120+ words source text
│   ├── pyproject.toml        # fastmcp
│   ├── requirements.txt      # fastmcp
│   └── test_server.py        # in-memory fastmcp.Client tests (TDD)
└── docs/
    ├── evidence/             # real captured output (github, filesystem, custom, jira template)
    └── screenshots/          # README checklist + 4 PNGs (user captures)
```

## Custom server contract

- `read_words(n)` helper: reads `lorem-ipsum.md`, returns first `n` whitespace-split words joined.
- Resource `lorem://ipsum` → 30 words (default); resource template `lorem://ipsum/{word_count}`
  → exactly `word_count` words.
- Tool `read(word_count: int = 30)` → same content as the resource.
- Edge cases: `word_count <= 0` → empty string; `word_count > available` → all words.

## Verification plan (live, this session)

1. `uv` resolves `fastmcp`; `test_server.py` passes (read default=30, read(5)=5, resource parity).
2. Filesystem MCP server starts and lists tools.
3. GitHub MCP live call (list PRs / commits on vkiryakov/gen-ai-software-engineering).
4. Adversarial verification workflow checks each Task's success criteria vs artifacts.

## User-owned steps

1. OAuth-authorize Atlassian in IDE; run last-5-bugs JQL; paste sanitized result into
   `docs/evidence/jira-mcp-result.md`.
2. Capture the 4 PNG screenshots per `docs/screenshots/README.md`.

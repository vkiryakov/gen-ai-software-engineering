# HOWTORUN — Homework 5 MCP Servers

How to **install dependencies**, **run** the custom server, **connect** the MCP
configuration, and **use/test** the `read` tool — plus setup for the three external
servers (GitHub, Filesystem, Jira/Atlassian).

---

## 0. Prerequisites

| Tool | Why | Check |
|------|-----|-------|
| [`uv`](https://docs.astral.sh/uv/) | run/deps the custom Python server | `uv --version` |
| Node.js + `npx` | run the GitHub & Filesystem servers | `npx --version` |
| Claude Code (or another MCP client) | connect to the servers | `claude --version` |

The custom server was verified with **Python 3.12** (fetched automatically by `uv`).

---

## 1. Custom MCP server (`custom-mcp-server/`)

### 1a. Install dependencies

`fastmcp` is declared in both [`pyproject.toml`](custom-mcp-server/pyproject.toml) and
[`requirements.txt`](custom-mcp-server/requirements.txt). Pick one:

```bash
cd custom-mcp-server

# Option A — uv (recommended; no manual venv needed)
uv sync                       # or just run/test directly, uv resolves on the fly

# Option B — pip
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 1b. Run the server (stdio)

```bash
# from custom-mcp-server/
uv run --python 3.12 server.py
# or, with a pip venv active:
python server.py
```

On startup it prints the FastMCP banner and
`Starting MCP server 'lorem-ipsum-server' with transport 'stdio'`. The process then waits
for an MCP client on stdio (Ctrl-C to stop). Normally you don't run it by hand — the MCP
client launches it via `mcp.json` (section 2).

### 1c. Test the `read` tool

```bash
# from custom-mcp-server/
uv run --python 3.12 test_server.py        # standalone report -> "10 passed, 0 failed"
uv run --python 3.12 --with pytest pytest  # same tests under pytest
```

The test suite exercises both the `read` tool and the `lorem://ipsum` resource through an
in-memory `fastmcp.Client`: default = 30 words, `word_count=N` = exactly N words, `<=0` =
empty, over-length = capped at the file's word count, and tool/resource agreement.

---

## 2. Connect the MCP configuration

All four servers are declared in [`mcp.json`](mcp.json). For **Claude Code** you can either:

**A. Project scope** — copy the config to a `.mcp.json` the client reads. From the repo
root you can point Claude Code at this file directly:

```bash
claude --mcp-config homework-5/mcp.json
```

or copy it to the project root as `.mcp.json`:

```bash
cp homework-5/mcp.json .mcp.json
```

**B. Per-server via CLI** (equivalent):

```bash
claude mcp add github    -- npx -y @modelcontextprotocol/server-github
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem \
  /Users/vkiryakov/workspace/set/gen-ai-software-engineering/homework-5
claude mcp add --transport sse atlassian https://mcp.atlassian.com/v1/sse
claude mcp add custom-lorem -- uv run --python 3.12 \
  --directory /Users/vkiryakov/workspace/set/gen-ai-software-engineering/homework-5/custom-mcp-server server.py
```

> ⚠️ The `filesystem` and `custom-lorem` entries use **absolute paths**. If you clone the
> repo elsewhere, update those paths in `mcp.json` to match your checkout.

Verify with `/mcp` inside Claude Code (or `claude mcp list`) — all four should show as
connected.

---

## 3. Per-server setup

### 3.1 GitHub MCP

Needs a **Personal Access Token** exported as `GITHUB_PERSONAL_ACCESS_TOKEN` (the
`mcp.json` entry reads it via `${GITHUB_PERSONAL_ACCESS_TOKEN}`):

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx   # scopes: repo, read:org
```

Create a fine-grained/classic token at <https://github.com/settings/tokens>.

**Try it:** *"Use the GitHub MCP to list the last 5 commits of
vkiryakov/gen-ai-software-engineering."*

> **Note on the package:** `mcp.json` uses the widely-used reference server
> `@modelcontextprotocol/server-github` (this is the one connected and demonstrated in this
> submission). GitHub's newer *official* server is the Go implementation
> `github/github-mcp-server` (Docker `ghcr.io/github/github-mcp-server`) or the hosted
> remote endpoint. To use the remote one instead, replace the `github` entry with:
>
> ```json
> "github": { "type": "http", "url": "https://api.githubcopilot.com/mcp/" }
> ```
>
> and authorize it via `/mcp` (OAuth) — same capabilities, no local Node process.

### 3.2 Filesystem MCP

No credentials — access is limited to the directory passed as the last CLI arg (here
`homework-5/`). Change that path to expose a different folder.

**Try it:** *"Use the Filesystem MCP to list the files in the homework-5 directory."*

### 3.3 Jira / Atlassian MCP

Uses the official **Atlassian Remote MCP Server** over SSE with **OAuth** (no token in the
config). On first use, run `/mcp` in Claude Code and authorize `atlassian` — a browser
window opens for Atlassian login and consent. (Alt endpoint: streamable HTTP at
`https://mcp.atlassian.com/v1/mcp`.)

**Required request** — last 5 bugs of a real project:

> *"Give me the tickets of the last 5 bugs on `<PROJECT>`."*

Under the hood this maps to a JQL search:

```jql
project = "<PROJECT>" AND issuetype = Bug ORDER BY created DESC
```

with `maxResults = 5`. Paste the sanitized result (ticket keys only, e.g. `PROJ-123`) into
[`docs/evidence/jira-mcp-result.md`](docs/evidence/jira-mcp-result.md).

### 3.4 Custom Lorem MCP

Already covered in section 1. Once connected via `mcp.json`:

**Try it:** *"Use the custom-lorem MCP `read` tool with word_count 5."* → returns the first
5 words of `lorem-ipsum.md`. Or read the resource `lorem://ipsum?word_count=5` directly.

---

## 4. What to capture as evidence

Real text output of the GitHub / Filesystem / custom calls is already saved in
[`docs/evidence/`](docs/evidence/). Capture the 4 PNG screenshots listed in
[`docs/screenshots/README.md`](docs/screenshots/README.md) from your IDE.

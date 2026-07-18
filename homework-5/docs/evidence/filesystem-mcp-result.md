# Evidence — Filesystem MCP

**Server:** `@modelcontextprotocol/server-filesystem` (stdio, launched via `npx`).
**Allowed directory:** `/Users/vkiryakov/workspace/set/gen-ai-software-engineering/homework-5`.
**Interaction:** started the server, listed its tools, then called `list_directory`.
Captured live in this session.

## Startup

```
Secure MCP Filesystem Server running on stdio
Client does not support MCP Roots, using allowed directories set from server args: [
  '/Users/vkiryakov/workspace/set/gen-ai-software-engineering/homework-5'
]
```

## Tools exposed (14)

```
read_file, read_text_file, read_media_file, read_multiple_files, write_file,
edit_file, create_directory, list_directory, list_directory_with_sizes,
directory_tree, move_file, search_files, get_file_info, list_allowed_directories
```

## Request / Response

```
tool: list_directory
args: { path: ".../homework-5" }

[DIR]  custom-mcp-server
[DIR]  docs
[FILE] HOWTORUN.md
[FILE] README.md
[FILE] TASKS.md
[FILE] mcp.json
```

**Screenshot to capture (`docs/screenshots/filesystem-mcp-result.png`):** in Claude Code,
ask *"Use the Filesystem MCP to list the files in the homework-5 directory"* and
screenshot the tool call + result.

# Evidence — Custom FastMCP server (`read` tool + resource)

Captured live in this session. The custom server lives in
[`custom-mcp-server/server.py`](../../custom-mcp-server/server.py) and reads from
[`lorem-ipsum.md`](../../custom-mcp-server/lorem-ipsum.md) (153 words).

Server banner on startup confirms FastMCP is used:

```
FastMCP 3.4.4
🖥  Server:      lorem-ipsum-server, 3.4.4
INFO  Starting MCP server 'lorem-ipsum-server' with transport 'stdio'
```

## 1. Real stdio launch — `uv run server.py` spawned as a subprocess

A FastMCP client launched the server as a real child process (proving the
starting command works and the tool/resource are served over stdio):

```
tools: ['read']
resources: []
resource_templates: ['lorem://ipsum{?word_count}']
read(4) -> 'Lorem ipsum dolor sit'
```

> The resource is registered as a **template** (`lorem://ipsum{?word_count}`),
> so it appears under `resource_templates`. Reading `lorem://ipsum` with no query
> returns the default 30 words; adding `?word_count=N` returns exactly `N`.

## 2. Test suite — `uv run test_server.py` (also runs under `pytest`)

```
lorem-ipsum.md total words: 153

PASS  test_read_words_default_returns_30
PASS  test_read_words_exact_count
PASS  test_read_words_over_available_caps_at_total
PASS  test_read_words_zero_or_negative_is_empty
PASS  test_resource_default_returns_30
PASS  test_resource_respects_word_count_query
PASS  test_tool_and_resource_agree
PASS  test_tool_named_read_is_registered
PASS  test_tool_read_default_returns_30
PASS  test_tool_read_respects_word_count

10 passed, 0 failed
```

`pytest -q` → `..........` (10 passed).

## 3. Sample outputs

`read()` (default 30 words):

```
Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi
```

`read(word_count=5)`:

```
Lorem ipsum dolor sit amet
```

Resource `lorem://ipsum?word_count=3`:

```
Lorem ipsum dolor
```

**Screenshot to capture (`docs/screenshots/custom-mcp-read-tool-result.png`):**
in Claude Code, ask *"Use the custom-lorem MCP server's `read` tool with word_count 5"*
and screenshot the tool call + result.

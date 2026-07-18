"""Custom FastMCP server for Homework 5.

Exposes the contents of ``lorem-ipsum.md`` through the Model Context Protocol:

* **Resource** ``lorem://ipsum`` — accepts an optional ``word_count`` query
  parameter (default: 30) and returns exactly that many words from the file.
* **Tool** ``read`` — takes an optional ``word_count`` parameter and returns the
  same word-limited content, so Claude can *call* it as an action.

Run it directly (``python server.py`` / ``uv run server.py``) to start a stdio
MCP server that a client such as Claude Code launches on demand.
"""

from pathlib import Path

from fastmcp import FastMCP

LOREM_PATH = Path(__file__).parent / "lorem-ipsum.md"
DEFAULT_WORD_COUNT = 30

mcp = FastMCP("lorem-ipsum-server")


def read_words(word_count: int = DEFAULT_WORD_COUNT) -> str:
    """Return the first ``word_count`` whitespace-separated words of the file.

    * ``word_count <= 0`` -> empty string
    * ``word_count`` greater than the number of words in the file -> all words
    """
    words = LOREM_PATH.read_text(encoding="utf-8").split()
    if word_count <= 0:
        return ""
    return " ".join(words[:word_count])


@mcp.resource("lorem://ipsum{?word_count}")
def lorem_ipsum_resource(word_count: int = DEFAULT_WORD_COUNT) -> str:
    """Resource URI: first ``word_count`` words (default 30) of lorem-ipsum.md."""
    return read_words(word_count)


@mcp.tool
def read(word_count: int = DEFAULT_WORD_COUNT) -> str:
    """Read ``word_count`` words (default 30) from lorem-ipsum.md."""
    return read_words(word_count)


if __name__ == "__main__":
    mcp.run()

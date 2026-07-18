"""Tests for the custom FastMCP lorem-ipsum server.

Runnable two ways:
  * pytest:            uv run pytest test_server.py
  * standalone script: uv run test_server.py   (prints a PASS/FAIL report)

The standalone run doubles as the evidence generator for
docs/evidence/custom-mcp-read-tool-result.md.
"""

import asyncio
from pathlib import Path

from fastmcp import Client

import server
from server import DEFAULT_WORD_COUNT, mcp, read_words

TOTAL_WORDS = len(Path(server.LOREM_PATH).read_text(encoding="utf-8").split())


# --- pure helper -----------------------------------------------------------

def test_read_words_default_returns_30():
    assert len(read_words().split()) == DEFAULT_WORD_COUNT == 30


def test_read_words_exact_count():
    assert len(read_words(5).split()) == 5
    assert read_words(5) == " ".join(read_words().split()[:5])


def test_read_words_zero_or_negative_is_empty():
    assert read_words(0) == ""
    assert read_words(-3) == ""


def test_read_words_over_available_caps_at_total():
    assert len(read_words(TOTAL_WORDS + 100).split()) == TOTAL_WORDS


# --- tool + resource via in-memory client ----------------------------------

async def _call_tool(word_count=None):
    async with Client(mcp) as client:
        args = {} if word_count is None else {"word_count": word_count}
        result = await client.call_tool("read", args)
        return result.data


async def _read_resource(uri):
    async with Client(mcp) as client:
        content = await client.read_resource(uri)
        return content[0].text


def test_tool_read_default_returns_30():
    assert len(asyncio.run(_call_tool()).split()) == 30


def test_tool_read_respects_word_count():
    assert len(asyncio.run(_call_tool(5)).split()) == 5


def test_tool_named_read_is_registered():
    async def _names():
        async with Client(mcp) as client:
            return {t.name for t in await client.list_tools()}
    assert "read" in asyncio.run(_names())


def test_resource_default_returns_30():
    assert len(asyncio.run(_read_resource("lorem://ipsum")).split()) == 30


def test_resource_respects_word_count_query():
    assert len(asyncio.run(_read_resource("lorem://ipsum?word_count=7")).split()) == 7


def test_tool_and_resource_agree():
    assert asyncio.run(_call_tool(12)) == asyncio.run(_read_resource("lorem://ipsum?word_count=12"))


# --- standalone report ------------------------------------------------------

def _main():
    checks = [name for name in sorted(globals()) if name.startswith("test_")]
    passed, failed = 0, 0
    print(f"lorem-ipsum.md total words: {TOTAL_WORDS}\n")
    for name in checks:
        try:
            globals()[name]()
            print(f"PASS  {name}")
            passed += 1
        except Exception as exc:  # noqa: BLE001 - report every failure
            print(f"FAIL  {name}: {exc!r}")
            failed += 1
    print(f"\n{passed} passed, {failed} failed")

    print("\n--- Sample outputs ---")
    print("read()  (default 30 words):")
    print(f"  {read_words()}")
    print("read(word_count=5):")
    print(f"  {read_words(5)}")
    print('resource lorem://ipsum?word_count=3:')
    print(f"  {asyncio.run(_read_resource('lorem://ipsum?word_count=3'))}")

    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    _main()

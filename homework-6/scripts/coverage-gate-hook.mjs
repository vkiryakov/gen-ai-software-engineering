#!/usr/bin/env node
// Claude Code PreToolUse hook: when a Bash `git push` is about to run, regenerate
// coverage and block the push (exit 2) if total line coverage is below 80%.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

let raw = "";
try {
  raw = readFileSync(0, "utf8"); // hook payload arrives on stdin
} catch {
  /* no stdin */
}

let command = "";
try {
  command = JSON.parse(raw)?.tool_input?.command ?? "";
} catch {
  /* not JSON */
}

// Only gate `git push`; let every other Bash command through untouched.
if (!/\bgit\s+push\b/.test(command)) process.exit(0);

const dir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
try {
  execSync("npm run coverage --silent", { cwd: dir, stdio: "ignore" });
  execSync("node scripts/check-coverage.mjs", { cwd: dir, stdio: "inherit" });
} catch {
  console.error("BLOCK: coverage gate failed — `git push` rejected by hook (coverage < 80%).");
  process.exit(2); // exit code 2 tells Claude Code to block the tool call
}
process.exit(0);

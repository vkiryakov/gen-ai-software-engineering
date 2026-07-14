#!/usr/bin/env bash
# Single-command orchestrator for the homework-4 4-agent pipeline:
#   bug-researcher -> research-verifier -> bug-planner -> bug-fixer -> security-verifier -> unit-test-generator
#
# Each stage is a headless `claude -p` call. The matching agents/<name>.agent.md file supplies
# the system prompt (frontmatter stripped), model, and allowed tools for that stage. Skills
# referenced inside an agent's own instructions (e.g. skills/research-quality-measurement.md)
# are loaded by the agent itself via its Read tool -- no separate wiring needed here.
#
# Usage: ./run-pipeline.sh [bug-id]   (defaults to 001)

set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BUG_ID="${1:-001}"
BUG_DIR="context/bugs/${BUG_ID}"
RESEARCH_DIR="${BUG_DIR}/research"
LOG_DIR="docs/pipeline-logs"
PERMISSION_MODE="bypassPermissions"

mkdir -p "${RESEARCH_DIR}" "${LOG_DIR}"

agent_field() {
  awk -F': *' -v key="$2" '$0 ~ "^"key":"{sub(/^[^:]*: */,""); print; exit}' "agents/$1.agent.md"
}

agent_prompt() {
  awk 'BEGIN{n=0} /^---$/{n++; next} n>=2{print}' "agents/$1.agent.md"
}

run_stage() {
  local name="$1" task="$2"
  local model tools
  model="$(agent_field "$name" model)"
  tools="$(agent_field "$name" tools)"
  echo "==> [${name}] (model: ${model}, tools: ${tools})"
  claude -p "$task" \
    --system-prompt "$(agent_prompt "$name")" \
    --model "$model" \
    --allowedTools "$tools" \
    --permission-mode "$PERMISSION_MODE" \
    --output-format text \
    | tee "${LOG_DIR}/${name}.log"
}

echo "### Bug pipeline for ${BUG_ID} ###"

run_stage bug-researcher \
  "Investigate ${BUG_DIR}/bug-context.md and the src/ tree. Write your findings to ${RESEARCH_DIR}/codebase-research.md exactly as your system prompt instructs."

run_stage research-verifier \
  "Verify ${RESEARCH_DIR}/codebase-research.md against the actual source and write ${RESEARCH_DIR}/verified-research.md exactly as your system prompt instructs."

if grep -qiE "research quality[^a-z]*:?[^a-z]*low" "${RESEARCH_DIR}/verified-research.md"; then
  echo "!! Research Quality is LOW per skills/research-quality-measurement.md -- pipeline stopped." >&2
  echo "   See ${RESEARCH_DIR}/verified-research.md for discrepancies, then re-run bug-researcher." >&2
  exit 1
fi

run_stage bug-planner \
  "Read ${RESEARCH_DIR}/verified-research.md and write ${BUG_DIR}/implementation-plan.md exactly as your system prompt instructs."

run_stage bug-fixer \
  "Execute ${BUG_DIR}/implementation-plan.md and write ${BUG_DIR}/fix-summary.md exactly as your system prompt instructs."

if ! grep -qiE "overall status[^a-z]*:?[^a-z]*success" "${BUG_DIR}/fix-summary.md"; then
  echo "!! Bug Fixer did not report success -- pipeline stopped. See ${BUG_DIR}/fix-summary.md" >&2
  exit 1
fi

run_stage security-verifier \
  "Read ${BUG_DIR}/fix-summary.md, review the changed files it lists, and write ${BUG_DIR}/security-report.md exactly as your system prompt instructs."

run_stage unit-test-generator \
  "Read ${BUG_DIR}/fix-summary.md, generate FIRST-compliant tests for the changed code only, run them, and write ${BUG_DIR}/test-report.md exactly as your system prompt instructs."

echo "### Pipeline complete for bug ${BUG_ID}. Outputs in ${BUG_DIR}/ (logs in ${LOG_DIR}/) ###"

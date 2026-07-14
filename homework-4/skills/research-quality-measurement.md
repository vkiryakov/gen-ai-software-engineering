---
name: research-quality-measurement
description: Rubric for scoring the reliability of bug-research output. Used by the Research Verifier to assign a quality level in verified-research.md.
---

# Research Quality Measurement

## Purpose
Objective, repeatable rubric the Research Verifier uses to rate the Bug
Researcher's output. Same input → same level, regardless of who runs it.

## Dimensions (score each: 2 = pass, 1 = partial, 0 = fail)
1. Reference accuracy  — every `file:line` points to a real, existing location.
2. Snippet fidelity    — every quoted snippet matches the source verbatim.
3. Root-cause accuracy — the stated cause is the actual cause, not a symptom.
4. Impact clarity      — what breaks, and under what conditions, is stated.
5. Actionability       — the Planner can act without re-doing the research.

Max score = 10.

## Hard-fail rule (overrides the numeric score)
Level is LOW regardless of total if ANY of these is true:
- a `file:line` reference points to a nonexistent file/line (fabrication);
- a quoted snippet does not match the source.
One hallucinated reference poisons everything downstream — categorical fail.

## Levels
| Level  | Condition                | Pipeline action              |
|--------|---------------------------|------------------------------|
| HIGH   | 9–10 and no hard-fail    | Planner proceeds.            |
| MEDIUM | 6–8 and no hard-fail     | Planner proceeds; gaps noted.|
| LOW    | ≤5, or any hard-fail     | STOP. Return to Researcher.  |

Verdict: pass = HIGH or MEDIUM · fail = LOW

## Required output — verified-research.md MUST contain:
1. Verification Summary — pass/fail + Research Quality level.
2. Verified Claims — each claim, its ref, and confirmed / adjusted.
3. Discrepancies Found — mismatches, fabricated refs, wrong causes.
4. Research Quality Assessment — level + per-dimension scores + reasoning.
5. References — the file:line locations actually checked.

---
name: unit-tests-FIRST
description: The FIRST principles (Fast, Independent, Repeatable, Self-validating, Timely) with concrete rules and a Definition-of-Done checklist. Used by the Unit Test Generator.
---

# Unit Tests: FIRST

Every generated test must satisfy all five. Test ONLY the new/changed code
listed in fix-summary.md. Follow the project framework (this app: Jest).

## F — Fast
- No real network, DB, filesystem, or `sleep`. Mock/stub all external I/O.
- Target: one test < 50 ms; the changed-code suite < a few seconds.
- Anti-pattern: `await fetch(realUrl)` → mock the client instead.

## I — Independent
- No shared mutable state. Each test builds its own fixtures.
- Must pass in any order, in isolation, and in parallel.
- Anti-pattern: test B depends on a record created by test A.

## R — Repeatable
- Deterministic: freeze time (no bare `Date.now()`), seed randomness,
  pin timezone/locale. No dependence on environment or network.
- Anti-pattern: `expect(res.date).toBe(new Date())` → inject/freeze the clock.

## S — Self-validating
- Pass/fail decided by assertions alone — no reading logs, no eyeballing.
- Anti-pattern: a test with no assertion that "passes" by not throwing.

## T — Timely
- Generated right after the fix, while the change is fresh.
- Per fixed bug: a regression test that FAILS on the old code, passes on new.
- For the fixed security issue: a test asserting the safe behavior.

## Structure
- Arrange–Act–Assert, one behavior per test, descriptive name
  (e.g. "returns 404 when the card belongs to another user").
- Cover: happy path, boundary/edge, and the bug's regression case.

## Definition of Done (self-check before writing test-report.md)
- [ ] Only changed code is tested
- [ ] No real I/O; all external deps mocked
- [ ] Passes in isolation and in random order
- [ ] Deterministic (clock/RNG controlled)
- [ ] Every test has ≥1 meaningful assertion
- [ ] A regression test exists per fixed bug + the security fix
- [ ] Suite is green; results recorded in test-report.md

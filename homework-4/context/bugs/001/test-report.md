# Test Report — Bug 001 (Notes API)

Source: `context/bugs/001/fix-summary.md` (7 changes, all in `src/routes/notes.js`).
Skill followed: `skills/unit-tests-FIRST.md`.
Scope: only the changed code in `src/routes/notes.js` is tested. No tests
were added or modified for untouched modules (`src/app.js`, `src/store.js`,
`src/server.js`).

## Tests Added

### `tests/notes-bug-001.test.js` (13 tests)

Covers Changes 1, 2, 3, 4, 7. Each test builds its own app via
`jest.isolateModules()`, forcing a fresh require of `src/store.js` (pristine
12-note seed) and a fresh read of `process.env.ADMIN_KEY` into the
`ADMIN_KEY` module-level `const` in `src/routes/notes.js`. This removes the
shared-mutable-state hazard (the store array and the `ADMIN_KEY` const are
both module-level) so no test can observe another test's mutations —
required for **Independent**, verified by running with `--randomize` (3
different seeds, all green).

- **Changes 1 & 2 — admin secret from env / fail-closed** (4 tests):
  - `rejects the old hardcoded secret now that ADMIN_KEY is not configured`
    — **regression/security**: sends the literal string that was hardcoded
    pre-fix (`supersecret-admin-2024`) as the header while `ADMIN_KEY` is
    unset; asserts `403`. Fails on old code (that literal was the actual
    secret, so it granted access → `200`).
  - `fails closed (403) when ADMIN_KEY is unset and no header is sent` —
    **regression**: targets Change 2 specifically (the intermediate bug the
    fix-summary flagged: with only Change 1 applied, `undefined !== undefined`
    is `false`, so an unauthenticated request would succeed). Fails on
    pre-fix code with `200` instead of `403`.
  - `allows bulk delete when the correct env-sourced key is supplied` —
    happy path.
  - `rejects an incorrect key even when ADMIN_KEY is configured` — edge
    case (wrong key, key configured).

- **Change 3 — pagination off-by-one** (3 tests):
  - `page=1 returns the first 'limit' items, not the second page` —
    **regression**: with `page=1, limit=5` against the 12 seeded notes,
    pre-fix `start = page * limit = 5` returns ids `6-10`; post-fix
    `start = (page-1)*limit = 0` returns ids `1-5`. Fails on old code.
  - `page=2 returns the next 'limit' items` — boundary case, second page.
  - `defaults to page=1, limit=10 when no query params are given` — happy
    path / default-parameter boundary.

- **Change 4 — case-insensitive search** (3 tests):
  - `matches when the query is uppercase and the title is mixed-case` —
    **regression**: query `"MEETING"` against titles `"Weekly Meeting Notes"`
    / `"Meeting Follow-up"`. Pre-fix `.includes(q)` is case-sensitive and
    returns no matches; post-fix both are found.
  - `still matches when query and title case already align` — happy path.
  - `returns an empty array when nothing matches` — edge case (no match).

- **Change 7 — PATCH allow-list (mass assignment)** (3 tests):
  - `ignores id and ownerId supplied in the request body` —
    **regression**: PATCHes note `1` with `{id: 999, ownerId: 'attacker',
    title: 'New Title'}`. Pre-fix `Object.assign(note, req.body)` overwrites
    `id`/`ownerId`; post-fix only `title`/`body` are allow-listed. Fails on
    old code (`id` becomes `999`).
  - `updates title and body when they are supplied` — happy path.
  - `leaves title/body unchanged when neither is supplied` — boundary case
    (empty patch body).

### `tests/notes-export-security.test.js` (5 tests)

Covers Changes 5 & 6 (removal of `exec`-based shell command building in
`GET /export`, replaced with `fs.writeFile` + `path.basename` sanitization,
and removal of the now-unused `child_process` import). `fs` is fully mocked
(`jest.mock('fs')`) so no test touches the real filesystem; the mock is
reset with `jest.clearAllMocks()` in `beforeEach` so no test's configured
behavior (e.g., a forced write failure) can leak into the next one
(**Independent**).

- `sanitizes a path-traversal filename to stay inside the exports dir` —
  **regression**: `filename=../../../etc/evil.json`. Asserts `fs.writeFile`
  is called with a path that is `path.join(EXPORTS_DIR, 'evil.json')` and
  contains no `..`. Fails on pre-fix code: the old handler never called
  `fs.writeFile` at all (it shelled out via `exec`), so this assertion — and
  the `200`/body-shape assertions — fail against the pre-fix implementation.
- `never shells out for a filename containing shell metacharacters` —
  **regression/security**: `filename=x;touch /tmp/pwned;.json`. Asserts the
  write target's directory is exactly `EXPORTS_DIR` and that `fs.writeFile`
  (not a shell) is what's invoked. Fails on pre-fix code for the same reason
  as above (no `fs.writeFile` call was ever made; the shell command was
  built via string interpolation instead).
- `uses the default filename when none is supplied` — happy path.
- `creates the exports directory when it does not already exist` — edge
  case (`fs.existsSync` mocked to `false`), unchanged logic but exercised
  through the new handler; passes on both old and new code (not a
  regression test, included for coverage of the surrounding, touched
  handler).
- `returns 500 with an error body when the write fails` — edge case
  (`fs.writeFile` mocked to call back with an error).

## Run Results

Full suite (`npx jest --verbose`), fix applied (current working tree):

```
Test Suites: 3 passed, 3 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        0.262 s, estimated 1 s
```

(3 test files: the 5 pre-existing baseline tests in `tests/notes.test.js`,
unmodified, plus the 18 new tests above — all pass.)

Randomization check (`npx jest --randomize`, 3 different seeds): 23/23
passed every run — confirms **Independent** (order does not matter).

Regression validation — `git stash` was used to temporarily restore the
pre-fix version of `src/routes/notes.js` (the prior committed version),
the new test files were run against it, then the fix was restored via
`git stash pop` (verified restored with `git status`/full suite green
again):

```
tests/notes-bug-001.test.js:        7 failed, 6 passed, 13 total
tests/notes-export-security.test.js: 4 failed, 1 passed, 5 total  (the 5th,
                                     "creates the exports directory...", is
                                     not a regression test and passed as
                                     expected on old code too)
```

All 8 tests tagged "regression" above failed against the pre-fix code and
pass against the fix — confirming each is a genuine regression test rather
than a tautology. After `git stash pop`, the full suite was re-run and
confirmed green (23/23) with the fix restored.

## DoD Checklist (from `skills/unit-tests-FIRST.md`)

- [x] Only changed code is tested — both new files target only the 7
      changes to `src/routes/notes.js`; no tests added for unchanged
      modules.
- [x] No real I/O; all external deps mocked — `fs` is mocked in
      `notes-export-security.test.js` (no real filesystem writes); no
      network calls anywhere; the in-memory `notes` store is the
      application's own module state (same pattern as the pre-existing
      baseline suite), not an external DB/service.
- [x] Passes in isolation and in random order — verified with
      `npx jest --randomize` across 3 seeds, 23/23 every time; state
      isolation achieved via `jest.isolateModules()` (store/`ADMIN_KEY`)
      and `jest.clearAllMocks()` (fs mock).
- [x] Deterministic (clock/RNG controlled) — no test asserts on
      `Date.now()`/timestamps; note IDs and seed data are fixed values from
      `src/store.js`; no randomness involved.
- [x] Every test has ≥1 meaningful assertion — all 18 new tests assert on
      `res.status` plus response-body content or mock call arguments; none
      pass merely by not throwing.
- [x] A regression test exists per fixed bug + the security fix — 8
      regression tests total: 2 for Changes 1/2 (one specifically the
      security fix — rejecting the previously-hardcoded secret — one for
      the fail-closed behavior), 1 for Change 3, 1 for Change 4, 1 for
      Change 7, and 2 for Changes 5/6 (path traversal + command injection).
      Each was verified to fail against the pre-fix code (see Run Results).
- [x] Suite is green; results recorded above — 23/23 passing with the fix
      applied.

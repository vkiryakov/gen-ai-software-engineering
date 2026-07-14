# Verified Research — Bug 001 (Notes API)

Verifier pass over `context/bugs/001/research/codebase-research.md`, checked
against live source (`src/routes/notes.js`, `src/store.js`). Rubric applied:
`skills/research-quality-measurement.md`.

---

## 1. Verification Summary

- **Verdict:** PASS
- **Research Quality level:** HIGH
- **Hard-fail triggered:** No (all `file:line` refs resolve to real locations;
  all quoted snippets match the source verbatim).

All 5 findings were independently confirmed against the source. The Planner may
proceed.

---

## 2. Verified Claims

| # | Claim | Reference | Status |
|---|-------|-----------|--------|
| 1 | Pagination offset computed as `page * limit` (should be `(page - 1) * limit`) | `src/routes/notes.js:29` | **Confirmed** — line 29 reads `  const start = page * limit;` verbatim. |
| 2 | Case-sensitive search via `n.title.includes(q)`, no normalization | `src/routes/notes.js:37` | **Confirmed** — line 37 reads `  const results = notes.filter((n) => n.title.includes(q));` verbatim. |
| 3 | OS command injection + path traversal in `/export`; user `filename` interpolated unescaped into `exec` string | `src/routes/notes.js:41-56` | **Confirmed** — block matches verbatim; only `payload` is escaped (line 48), `filename` is not; `exec` used (imported line 4). |
| 4 | Mass-assignment via `Object.assign(note, req.body)` with no allow-list | `src/routes/notes.js:73-80` | **Confirmed** — block matches verbatim. |
| 5 | Hardcoded admin secret `ADMIN_KEY` | `src/routes/notes.js:10` | **Confirmed** — line 10 reads `const ADMIN_KEY = 'supersecret-admin-2024';` verbatim; used at line 60 to gate `DELETE /admin/all` (line 59), as stated. |

### Supporting-detail checks (illustrative numbers in Impact sections)
- Finding 1 example "`notes.length` = 12": **Confirmed** — `src/store.js` seeds
  exactly 12 notes. `page=1, limit=10` → `start=10` → `slice(10,20)` returns
  ids 11–12, exactly as the research states.
- Finding 2 example: query `meeting` failing to match `"Weekly Meeting Notes"`:
  **Confirmed** — that title exists (`store.js:2`, id 1) and `includes` is
  case-sensitive, so a lowercase query drops it.
- Finding 3 cross-ref to "line 48" for the escaped payload: **Confirmed**.
- Finding 5 cross-refs to line 60 (`x-admin-key` check) and the
  `DELETE /api/notes/admin/all` route: **Confirmed** (lines 59–60).

No claim required adjustment.

---

## 3. Discrepancies Found

None. No fabricated references, no snippet mismatches, no misattributed causes.

(Minor, non-blocking observation — not a discrepancy: Finding 4's phrase
"corrupting `store.notes` lookups by id" is a reasonable characterization; the
store exports `notes` directly, and mutating a note's `id` would indeed break
subsequent `find`/`findIndex` lookups. Consistent with source.)

---

## 4. Research Quality Assessment

**Level: HIGH** (score 10/10, no hard-fail)

| Dimension | Score | Reasoning |
|-----------|:-----:|-----------|
| Reference accuracy | 2 | Every `file:line` (10, 29, 37, 41-56, 73-80, plus cross-refs to 48, 59-60) points to a real, existing location. |
| Snippet fidelity | 2 | Every quoted snippet matches the source byte-for-byte, including indentation and escaping. |
| Root-cause accuracy | 2 | Each stated cause is the actual defect (off-by-one offset, case sensitivity, unescaped shell interpolation, unfiltered `Object.assign`, hardcoded secret) — not a symptom. |
| Impact clarity | 2 | Each finding states what breaks and under what conditions, with concrete, verifiable examples (page-1 skip, casing miss, injection payload, ownership hijack, secret exposure). |
| Actionability | 2 | The Planner can act directly: exact locations, the wrong expression, and the correct intent are all present for every finding. |

**Total: 10 / 10 → HIGH.**

Pipeline action: Planner proceeds.

---

## 5. References (locations actually checked)

- `src/routes/notes.js:10` — `ADMIN_KEY` declaration (Finding 5)
- `src/routes/notes.js:4` — `exec` import (supports Finding 3)
- `src/routes/notes.js:5` — `notes` store import (supports Finding 4)
- `src/routes/notes.js:25-33` — `GET /` pagination (Finding 1, line 29)
- `src/routes/notes.js:35-39` — `GET /search` (Finding 2, line 37)
- `src/routes/notes.js:41-57` — `GET /export` (Finding 3, lines 41-56; payload escape line 48)
- `src/routes/notes.js:59-65` — `DELETE /admin/all` (supports Finding 5, lines 59-60)
- `src/routes/notes.js:73-80` — `PATCH /:id` (Finding 4)
- `src/store.js:1-22` — seed data (verifies Finding 1 & 2 illustrative numbers)

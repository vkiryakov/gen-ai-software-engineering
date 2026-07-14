# Fix Summary — Bug 001 (Notes API)

Source plan: `context/bugs/001/implementation-plan.md`
Test command (run after each change): `npm test`

## Changes Made

### Change 1 — Remove hardcoded admin secret
- **File:** `src/routes/notes.js`
- **Location:** lines 9-10 (declaration)
- **Before:**
  ```js
  // Hardcoded admin secret used to gate the bulk-delete endpoint below.
  const ADMIN_KEY = 'supersecret-admin-2024';
  ```
- **After:**
  ```js
  // Admin secret must be supplied via environment variable; no insecure default.
  const ADMIN_KEY = process.env.ADMIN_KEY;
  ```
- **Test result:** `npm test` → **1 failing** (`DELETE /api/notes/admin/all requires the admin key`, expected 403, got 200). This is the exact, plan-documented consequence of Change 1 in isolation (route now fails open when `ADMIN_KEY` is `undefined` and no header is sent). Per the plan, Change 2 was applied immediately after as its required pair; see below.

### Change 2 — Fail closed when admin secret is not configured
- **File:** `src/routes/notes.js`
- **Location:** lines 59-62 (`DELETE /admin/all` guard)
- **Before:**
  ```js
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
  ```
- **After:**
  ```js
  if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) {
  ```
- **Test result:** `npm test` → **5/5 passed** (the failure from Change 1 resolved).

### Change 3 — Fix pagination off-by-one
- **File:** `src/routes/notes.js`
- **Location:** line 28 (`GET /` handler)
- **Before:** `const start = page * limit;`
- **After:** `const start = (page - 1) * limit;`
- **Test result:** `npm test` → **5/5 passed**.

### Change 4 — Case-insensitive title search
- **File:** `src/routes/notes.js`
- **Location:** line 36 (`GET /search` handler)
- **Before:** `const results = notes.filter((n) => n.title.includes(q));`
- **After:** `const results = notes.filter((n) => n.title.toLowerCase().includes(q.toLowerCase()));`
- **Test result:** `npm test` → **5/5 passed**.

### Change 5 — Remove OS command injection / path traversal in `/export`
- **File:** `src/routes/notes.js`
- **Location:** lines 40-57 (`GET /export` handler)
- **Before:** built a shell command via `exec('echo \'...\' > ' + filename, ...)` with unescaped, user-controlled `filename`.
- **After:** replaced `exec`/shell interpolation with `fs.writeFile`; `filename` is sanitized via `path.basename()` and joined with `EXPORTS_DIR` via `path.join()`.
- **Test result:** `npm test` → **5/5 passed**.

### Change 6 — Drop now-unused `child_process` import
- **File:** `src/routes/notes.js`
- **Location:** line 4
- **Before:** `const { exec } = require('child_process');`
- **After:** (line removed)
- **Test result:** `npm test` → **5/5 passed**.

### Change 7 — Allow-list fields on `PATCH /:id` (fix mass assignment)
- **File:** `src/routes/notes.js`
- **Location:** lines 73-80 (`PATCH /:id` handler)
- **Before:**
  ```js
  Object.assign(note, req.body);
  note.updatedAt = new Date().toISOString();
  ```
- **After:**
  ```js
  const { title, body } = req.body;
  if (title !== undefined) note.title = title;
  if (body !== undefined) note.body = body;
  note.updatedAt = new Date().toISOString();
  ```
- **Test result:** `npm test` → **5/5 passed**.

## Overall Status: **success**

All 7 changes from the plan were applied exactly as specified, in the documented order. The existing test suite (`tests/notes.test.js`, 5 tests) passes after the final change. The one intermediate failure (after Change 1, before Change 2) was explicitly predicted by the plan's own rationale and resolved by applying the very next change in the plan — no improvisation was needed and no test was altered.

## Manual Verification

Run these against a locally started server (`npm start`, default port per `src/server.js`) to confirm each fix:

1. **Admin secret / fail-closed (Changes 1-2)**
   - Without setting `ADMIN_KEY`: `curl -X DELETE http://localhost:PORT/api/notes/admin/all` → expect `403 {"error":"forbidden"}` (previously would have been `200` once secret was blanked, confirming fail-closed behavior).
   - Set `ADMIN_KEY=mysecret npm start`, then `curl -X DELETE -H "x-admin-key: mysecret" http://localhost:PORT/api/notes/admin/all` → expect `200 {"deleted":true}`.
   - `curl -X DELETE -H "x-admin-key: wrong" http://localhost:PORT/api/notes/admin/all` → expect `403`.

2. **Pagination off-by-one (Change 3)**
   - Seed/create ≥10 notes, then `curl "http://localhost:PORT/api/notes?page=1&limit=10"` → expect the first 10 notes returned (not notes 11+).

3. **Case-insensitive search (Change 4)**
   - Create a note titled `"Weekly Meeting Notes"`, then `curl "http://localhost:PORT/api/notes/search?q=meeting"` → expect it in the `results` array.

4. **Export command injection / path traversal (Changes 5-6)**
   - `curl "http://localhost:PORT/api/notes/export?filename=x;touch%20/tmp/pwned;.json"` → expect no `/tmp/pwned` file created, and export written safely (or rejected) with no shell execution.
   - `curl "http://localhost:PORT/api/notes/export?filename=../../etc/evil.json"` → expect the file to land inside the `exports/` directory only (check via `ls exports/`), not escape it.

5. **Mass assignment on PATCH (Change 7)**
   - `curl -X PATCH http://localhost:PORT/api/notes/1 -H "Content-Type: application/json" -d '{"id":999,"ownerId":"attacker","title":"new title"}'`
   - Then `curl http://localhost:PORT/api/notes/1` → expect `id` still `1`, `ownerId` unchanged, and `title` updated to `"new title"`.

6. **Automated regression check:** `npm test` → expect `Tests: 5 passed, 5 total`.

## References
- `src/routes/notes.js` (all 7 changes)
- `context/bugs/001/implementation-plan.md` (plan followed)
- `tests/notes.test.js` (existing suite used as the test command's target; unmodified)

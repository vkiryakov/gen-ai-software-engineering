# Security Report — Bug 001 (Notes API)

**Scope:** Post-fix review of the changes described in `context/bugs/001/fix-summary.md`.
All 7 changes touch a single file: `src/routes/notes.js`. Supporting files
(`src/store.js`, `package.json`) were read for context.

**Method:** Reviewed each changed hunk for injection (SQL/command), hardcoded
secrets, insecure comparisons, missing input validation, unsafe dependencies,
and XSS/CSRF on the HTTP surface.

**Mode:** REPORT ONLY. No source or test files were modified. Remediations below
describe the minimal fix; they are not applied.

---

## What the fix did well (verified)

These are confirmations, not findings — the fix genuinely closed the issues it
targeted:

- **Command injection removed (Change 5/6):** `exec()` and shell string
  interpolation are gone; `/export` now uses `fs.writeFile`, and
  `child_process` is no longer imported. The OS-command-injection vector is
  eliminated.
- **Hardcoded secret removed + fail-closed (Change 1/2):** `ADMIN_KEY` now comes
  from `process.env`, and the guard rejects when `ADMIN_KEY` is falsy, so a
  missing env var no longer opens the admin route.
- **Mass assignment fixed (Change 7):** `PATCH /:id` now allow-lists `title` and
  `body`, so `id`, `ownerId`, and `createdAt` can no longer be overwritten via
  the body.

The findings below are residual/adjacent issues that remain in the reviewed code.

---

## Findings

### 1. Broken access control — no authN/authZ on read/update/delete of any note (IDOR)
- **Severity:** HIGH
- **Location:** `src/routes/notes.js:67` (`GET /:id`), `src/routes/notes.js:73`
  (`PATCH /:id`), `src/routes/notes.js:84` (`DELETE /:id`)
- **Description:** None of these handlers authenticate the caller or check that
  the caller owns the note (`note.ownerId`). Any anonymous client can read,
  modify, or delete any note by iterating ids. Change 7 correctly stopped
  `ownerId` from being *overwritten*, but it did not add an ownership *check*, so
  the object-level access-control gap remains: user `u2` can `PATCH`/`DELETE`
  user `u1`'s notes. This is a pre-existing architectural gap, not introduced by
  this fix, but it lives in a handler the fix edited and dominates the residual
  risk. Same applies to the unauthenticated `POST /` and `GET /` list.
- **Remediation:** Introduce authentication (e.g. session/JWT middleware) that
  populates a trusted `req.userId`, then in each `/:id` handler compare
  `note.ownerId === req.userId` and return `403` on mismatch. Do not derive the
  caller identity from client-supplied body/query fields.

### 2. Unauthenticated, state-changing GET on `/export`
- **Severity:** MEDIUM
- **Location:** `src/routes/notes.js:40` (`GET /export`, write at line 51)
- **Description:** `/export` is a `GET` that (a) exposes the full notes dataset
  and (b) writes a file to disk on every call, with no authentication. Because
  it is a side-effecting GET, it is CSRF-triggerable (e.g. an `<img>`/`fetch`
  from a victim's browser) and can be called repeatedly by any client to write
  files, enabling disk-exhaustion DoS and overwriting of previously exported
  files within `exports/`. It also discloses all notes (including other users'
  content) to any caller.
- **Remediation:** Require authentication/authorization on this route; move the
  side effect off `GET` (use `POST`) and apply CSRF protection; optionally rate-
  limit and cap the number/size of export files.

### 3. Non-constant-time comparison of the admin key
- **Severity:** LOW
- **Location:** `src/routes/notes.js:60`
- **Description:** The admin key check uses `req.headers['x-admin-key'] !==
  ADMIN_KEY`. JavaScript `!==` on strings short-circuits on the first differing
  byte and on length mismatch, making the comparison non-constant-time. This is
  the "insecure comparison on a token" pattern. Network jitter makes remote
  timing exploitation difficult in practice, hence LOW, but it is a genuine
  weakness for a secret comparison.
- **Remediation:** Compare with a constant-time primitive, e.g.
  `crypto.timingSafeEqual(Buffer.from(provided || ''), Buffer.from(ADMIN_KEY))`
  after confirming both are non-empty and equal length (guard length first, and
  keep the existing `!ADMIN_KEY` fail-closed check).

### 4. Export error detail leaked to client
- **Severity:** LOW
- **Location:** `src/routes/notes.js:53`
- **Description:** On write failure the handler returns `err.message` in the
  response body (`{ error: 'export failed', detail: err.message }`). Node fs
  errors typically include absolute filesystem paths (e.g. the resolved
  `EXPORTS_DIR`), disclosing server directory structure to unauthenticated
  callers.
- **Remediation:** Return a generic error message to the client and log the
  detailed error server-side only.

### 5. `/export` filename has no extension/format allow-list
- **Severity:** LOW
- **Location:** `src/routes/notes.js:42`
- **Description:** `path.basename()` correctly strips directory components, so
  path traversal is mitigated (a write can no longer escape `EXPORTS_DIR`).
  However there is no validation of the filename itself: a caller can choose any
  name/extension (e.g. `index.html`, `.htaccess`) inside `exports/`. If that
  directory is ever served statically, an attacker-chosen filename/extension
  could become a content-injection vector.
- **Remediation:** Validate the sanitized filename against a strict allow-list
  (e.g. `/^[\w.-]+\.json$/`) and reject anything else with `400`.

### 6. No upper bound / type validation on pagination `limit`
- **Severity:** LOW
- **Location:** `src/routes/notes.js:26`
- **Description:** `limit` is `parseInt(req.query.limit, 10) || 10` with no
  maximum. With an in-memory array this is low impact today, but against a
  real/growing datastore an unbounded `limit` invites resource-exhaustion.
- **Remediation:** Clamp `limit` to a sane maximum (e.g.
  `Math.min(Math.max(parsed, 1), 100)`), and reject non-positive values.

### 7. No input validation on note content (`title`/`body`)
- **Severity:** INFO
- **Location:** `src/routes/notes.js:14` (`POST /`), `src/routes/notes.js:77`
  (`PATCH /:id`)
- **Description:** `title`/`body` are accepted with a presence check only (no
  type or length constraints). This is not an injection risk in the current
  JSON-only responses (`res.json` sets `application/json`, so stored values are
  not rendered as HTML here), but unbounded/typed-wrong input can cause storage
  bloat and would become a stored-XSS source if any consumer later renders these
  fields as HTML.
- **Remediation:** Enforce `typeof === 'string'` and reasonable max lengths on
  `title`/`body`; ensure any HTML consumer output-encodes these fields.

---

## Dependencies

`package.json` pins `express@^4.19.2` (includes the CVE-2024-29041 open-redirect
fix) with only `jest`/`supertest` as dev dependencies. No unsafe or known-
vulnerable production dependency was identified in scope.

---

## Summary (count per severity)

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 1 |
| MEDIUM   | 1 |
| LOW      | 4 |
| INFO     | 1 |
| **Total**| **7** |

**Bottom line:** The 7 applied changes correctly close the command-injection,
hardcoded-secret, fail-open, and mass-assignment issues they targeted. No new
vulnerabilities were introduced. The dominant residual risk is the absence of
authentication/authorization across the note endpoints (Finding 1) and the
unauthenticated side-effecting `/export` route (Finding 2); the remaining items
are hardening improvements.

# Implementation Plan — Bug 001 (Notes API)

Source: `context/bugs/001/research/verified-research.md` (Verdict: PASS,
Research Quality: HIGH — all 5 findings confirmed against live source, no
discrepancies). All 5 confirmed findings are addressed below. Order follows
top-to-bottom file position; the two admin-secret changes are grouped first
since the route guard depends on the declaration it reads, and the export
changes are grouped together (handler rewritten before its now-unused import
is dropped).

---

## Change 1 — Remove hardcoded admin secret

- **File:** `src/routes/notes.js`
- **Location:** lines 9-10 (declaration)

**Before:**
```js
// Hardcoded admin secret used to gate the bulk-delete endpoint below.
const ADMIN_KEY = 'supersecret-admin-2024';
```

**After:**
```js
// Admin secret must be supplied via environment variable; no insecure default.
const ADMIN_KEY = process.env.ADMIN_KEY;
```

**Rationale:** Verified Finding 5 confirms a hardcoded secret
`'supersecret-admin-2024'` at line 10 gates the admin bulk-delete route.
Hardcoding a secret in source means anyone with source access (or the repo
history) has permanent admin access regardless of deployment. Sourcing it
from the environment removes the secret from source control.

---

## Change 2 — Fail closed when admin secret is not configured

- **File:** `src/routes/notes.js`
- **Location:** lines 59-62 (`DELETE /admin/all` guard)

**Before:**
```js
router.delete('/admin/all', (req, res) => {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(403).json({ error: 'forbidden' });
  }
```

**After:**
```js
router.delete('/admin/all', (req, res) => {
  if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(403).json({ error: 'forbidden' });
  }
```

**Rationale:** This change is a direct, necessary consequence of Change 1.
Once `ADMIN_KEY` can be `undefined` (env var not set), a request sent with no
`x-admin-key` header would also read as `undefined`, so
`undefined !== undefined` is `false` and the bulk-delete would incorrectly
succeed with zero credentials. Requiring `ADMIN_KEY` to be truthy before
comparing keeps the route fail-closed, preserving (and hardening) the access
control Finding 5 identified at lines 59-60.

---

## Change 3 — Fix pagination off-by-one

- **File:** `src/routes/notes.js`
- **Location:** line 29 (`GET /` handler)

**Before:**
```js
  const start = page * limit;
```

**After:**
```js
  const start = (page - 1) * limit;
```

**Rationale:** Verified Finding 1 confirms `start = page * limit` at line 29,
which skips the first `limit` items on `page=1` (e.g. with 12 seeded notes,
`page=1, limit=10` yields `start=10`, returning only ids 11-12 instead of
1-10). `(page - 1) * limit` makes `page=1` start at offset 0, matching
standard 1-indexed pagination semantics.

---

## Change 4 — Case-insensitive title search

- **File:** `src/routes/notes.js`
- **Location:** line 37 (`GET /search` handler)

**Before:**
```js
  const results = notes.filter((n) => n.title.includes(q));
```

**After:**
```js
  const results = notes.filter((n) => n.title.toLowerCase().includes(q.toLowerCase()));
```

**Rationale:** Verified Finding 2 confirms `n.title.includes(q)` at line 37 is
case-sensitive, so a query like `meeting` fails to match the seeded title
`"Weekly Meeting Notes"`. Lower-casing both sides before comparison makes the
search case-insensitive without changing its substring-match behavior.

---

## Change 5 — Remove OS command injection / path traversal in `/export`

- **File:** `src/routes/notes.js`
- **Location:** lines 41-56 (`GET /export` handler)

**Before:**
```js
router.get('/export', (req, res) => {
  const filename = req.query.filename || 'notes-export.json';

  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }

  const payload = JSON.stringify(notes).replace(/'/g, "'\\''");
  const cmd = `echo '${payload}' > ${filename}`;

  exec(cmd, { cwd: EXPORTS_DIR }, (err) => {
    if (err) {
      return res.status(500).json({ error: 'export failed', detail: err.message });
    }
    res.json({ exported: filename });
  });
});
```

**After:**
```js
router.get('/export', (req, res) => {
  const requestedFilename = req.query.filename || 'notes-export.json';
  const filename = path.basename(requestedFilename);

  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }

  const payload = JSON.stringify(notes);
  const filePath = path.join(EXPORTS_DIR, filename);

  fs.writeFile(filePath, payload, (err) => {
    if (err) {
      return res.status(500).json({ error: 'export failed', detail: err.message });
    }
    res.json({ exported: filename });
  });
});
```

**Rationale:** Verified Finding 3 confirms the user-controlled `filename` is
interpolated unescaped into a shell string executed via `exec` (lines 41-56;
only `payload` is escaped at line 48, `filename` is not), allowing both shell
command injection (e.g. `filename=x; rm -rf /`) and path traversal (e.g.
`filename=../../etc/cron.d/evil`). Replacing `exec`/shell interpolation with
`fs.writeFile` eliminates the shell entirely (no command injection surface),
and `path.basename()` strips any directory components from the user input so
the write is confined to `EXPORTS_DIR` (no path traversal).

---

## Change 6 — Drop now-unused `child_process` import

- **File:** `src/routes/notes.js`
- **Location:** line 4

**Before:**
```js
const { exec } = require('child_process');
```

**After:**
```js
(line removed)
```

**Rationale:** Change 5 removes the only call site of `exec` in this file.
Leaving the import in place after the fix would keep an unused,
security-sensitive API (`child_process.exec`) imported for no reason,
inviting future misuse. This must be applied after Change 5, once no code
references `exec`.

---

## Change 7 — Allow-list fields on `PATCH /:id` (fix mass assignment)

- **File:** `src/routes/notes.js`
- **Location:** lines 73-80 (`PATCH /:id` handler)

**Before:**
```js
router.patch('/:id', (req, res) => {
  const note = notes.find((n) => n.id === parseInt(req.params.id, 10));
  if (!note) return res.status(404).json({ error: 'not found' });

  Object.assign(note, req.body);
  note.updatedAt = new Date().toISOString();
  res.json(note);
});
```

**After:**
```js
router.patch('/:id', (req, res) => {
  const note = notes.find((n) => n.id === parseInt(req.params.id, 10));
  if (!note) return res.status(404).json({ error: 'not found' });

  const { title, body } = req.body;
  if (title !== undefined) note.title = title;
  if (body !== undefined) note.body = body;
  note.updatedAt = new Date().toISOString();
  res.json(note);
});
```

**Rationale:** Verified Finding 4 confirms `Object.assign(note, req.body)` at
lines 73-80 applies the entire request body with no allow-list, letting a
caller overwrite `id` (corrupting subsequent `find`/`findIndex` lookups by
id, as the research notes) or `ownerId` (hijacking ownership). Explicitly
copying only the mutable, intended fields (`title`, `body`) prevents
overwriting `id`, `ownerId`, or `createdAt` via the request body.

---

## Test Command

Run after each change:

```
npm test
```

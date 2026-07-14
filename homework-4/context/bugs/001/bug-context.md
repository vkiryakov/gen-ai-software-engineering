# Bug Context 001 — Notes API

## App under test
`src/` — a small Express "Notes API" (in-memory store, no DB). Entry point:
`src/server.js`. Routes: `src/routes/notes.js`. Test command: `npm test`.

## Reported issues (from users / internal review)

1. **Pagination looks wrong.** A user asked for the first page of notes
   (`GET /api/notes?page=1&limit=10`) and got back notes they didn't expect —
   it looked like the first batch of notes was being skipped entirely.

2. **Search misses obvious matches.** `GET /api/notes/search?q=meeting` did
   not return a note titled "Weekly Meeting Notes", even though the word is
   clearly in the title. Casing of the query seems to matter when it
   shouldn't.

3. **Security concern raised in review.** The note export feature
   (`GET /api/notes/export?filename=...`) and the update endpoint
   (`PATCH /api/notes/:id`) were added quickly under deadline pressure and
   were flagged as "worth a second look" before shipping — no specifics were
   given, just that user-supplied input flows into them in ways that weren't
   fully thought through. There's also a hardcoded value in the routes file
   that shouldn't be there.

## Scope
Only `src/` is in scope for this pass. Do not modify `tests/` except to add
new regression tests after fixes land.

# Design: Completing TASKS.md — Multi-Format Import, Classification Storage, Tests, Docs

**Date:** 2026-07-09
**Status:** Approved
**Scope:** Close the gap between the current homework-2 implementation and the TASKS.md assignment spec.

## 1. Context & Gap Analysis

The monorepo (React web + NestJS API + shared `@repo/contracts` Zod package) already implements:

- Full ticket CRUD with Zod validation, filtering, and correct HTTP status codes
- Rule-based auto-classification (`ClassificationService`) with confidence, reasoning, and matched keywords; `auto_classify` flag on create; manual override; `POST /tickets/:id/auto-classify`
- 9 unit tests across 2 spec files; README.md with one Mermaid diagram

Missing relative to TASKS.md:

1. **CSV and XML import** — `POST /tickets/import` accepts only a JSON `records` array in the body
2. **Classification confidence is not persisted** on the ticket; decisions are not logged
3. **Test suite** — assignment requires ~56 tests across 8 suites with >85% coverage
4. **Docs** — API_REFERENCE.md, ARCHITECTURE.md, TESTING_GUIDE.md do not exist
5. **Deliverables** — sample data files (50 CSV / 20 JSON / 30 XML + invalid files), coverage screenshot

## 2. Decisions (approved during brainstorming)

| Decision | Choice |
| --- | --- |
| Import transport | Multipart file upload (`FileInterceptor`, multer via `@nestjs/platform-express`) |
| Architecture | Modular: dedicated `ImportModule` with per-format parser services |
| Old JSON `records` body | **Dropped** — JSON import = upload a `.json` file; nothing consumes the old shape |
| Classification storage | Structured optional `classification` object on the ticket (provenance) |
| Decision logging | NestJS `Logger` in `ClassificationService` |
| Web UI | Full treatment: import screen + classification display, routed with **react-router** |
| Test layout | Idiomatic NestJS (colocated unit specs + `test/` for e2e), mapped 1:1 to required suites |
| Documentation | The 4 files listed in TASKS.md (README, API_REFERENCE, ARCHITECTURE, TESTING_GUIDE) |
| Parsing libraries | `papaparse` (CSV), `fast-xml-parser` (XML) — both synchronous, zero-config |

## 3. Contracts (`packages/contracts`)

- `classification.ts`: add `ticketClassificationSchema` = existing `classificationResultSchema` fields plus `classified_at` (ISO datetime string).
- `ticket.ts`: `ticketSchema` gains optional `classification: ticketClassificationSchema.optional()`.
- **Semantics:** `category`/`priority` on the ticket are always the operative values. The `classification` object is provenance — "what the classifier said, when". A manual `PUT` that changes category/priority leaves provenance intact (this is the manual-override behavior; documented in API_REFERENCE.md).
- `import.ts` is unchanged — `ImportSummary`/`ImportError`/`importFormatSchema` already match the required response shape.
- Contracts stay dependency-free: parsing libraries live only in the API.

## 4. API: Import Pipeline (`apps/api/src/import/`)

New `ImportModule` with three parser services, each implementing `parse(content: string): unknown[]` and throwing a typed `ImportParseError` (mapped to HTTP 400 with a meaningful message) on malformed input:

- **CsvParserService** (papaparse): header row required; quoted fields supported. Flat-to-nested mapping: `tags` column is pipe-separated (`billing|urgent`); metadata comes from `metadata_source`, `metadata_browser`, `metadata_device_type` columns. Empty cells → field omitted so Zod optionality applies.
- **JsonParserService**: accepts a bare array or a `{ "records": [...] }` envelope.
- **XmlParserService** (fast-xml-parser): `<tickets><ticket>…</ticket></tickets>`; `<tags><tag>x</tag></tags>` and nested `<metadata>` element; single-child elements normalized to arrays.

**Endpoint:** `POST /tickets/import`

- Multipart upload, field name `file`, size limit 1 MB
- Format resolution precedence: explicit `?format=csv|json|xml` query param → file extension → MIME type; unresolvable or empty file → 400
- Optional `?auto_classify=true` classifies every imported row
- Response: existing `ImportSummary` (`total`, `successful`, `failed`, `errors[{row, field, message}]`)

**Data flow:** controller (format resolution) → parser (text → `unknown[]`) → `TicketsService.importRecords(rows, autoClassify)` (per-row `createTicketSchema.safeParse` → create → optional classify) → `ImportSummary`. `importRecords` is the current `importJson`, renamed and extended with the `autoClassify` flag.

**Error handling model:** an unparseable *file* fails fast with 400; a malformed *row* never fails the batch — it lands in `errors` with its row index.

## 5. API: Classification Storage & Logging

- On create with `auto_classify: true` and on `POST /tickets/:id/auto-classify`, persist `classification`: `{ category, priority, confidence, reasoning, keywords_found, classified_at }`.
- Explicit `category`/`priority` in a create payload still win over classifier output (unchanged behavior).
- `ClassificationService` logs every decision via NestJS `Logger`: ticket id (when known), chosen category/priority, confidence, matched keywords — including the "no signals → other/medium" case.

## 6. Web UI (`apps/web`)

- Add `react-router-dom`; routes: `/` (ticket list + create form) and `/import` (import screen), with nav links between them.
- **Import screen:** drag-and-drop zone + file picker (`.csv`/`.json`/`.xml`), "Auto-classify imported tickets" checkbox; after upload, summary cards (total / successful / failed) and a per-row error table from `ImportSummary`.
- **Ticket list:** confidence badge (e.g. "87%") for tickets with a stored `classification`; expandable details showing reasoning and matched keywords; per-ticket "Auto-classify" button.
- `client.ts`: new `importFile(file, autoClassify)` using `FormData` (no manual Content-Type so the browser sets the multipart boundary).

## 7. Testing Strategy (target: >85% coverage, enforced)

Mapping to the assignment's required suites:

| TASKS.md suite | File | Tests |
| --- | --- | --- |
| test_ticket_api (11) | `apps/api/test/ticket-api.e2e-spec.ts` — supertest over all endpoints + error codes | 11+ |
| test_ticket_model (9) | `apps/api/test/ticket-model.spec.ts` — Zod schema validation: email, string lengths, enums, strict mode | 9+ |
| test_import_csv (6) | `apps/api/src/import/csv-parser.spec.ts` — happy path, quoting, tags/metadata mapping, malformed, empty, missing headers | 6+ |
| test_import_json (5) | `apps/api/src/import/json-parser.spec.ts` — array, envelope, malformed, non-array, empty | 5+ |
| test_import_xml (5) | `apps/api/src/import/xml-parser.spec.ts` — happy path, single-ticket normalization, nested tags/metadata, malformed, empty | 5+ |
| test_categorization (10) | `apps/api/src/tickets/classification.service.spec.ts` (extended) — one case per category and priority, confidence, defaults | 10+ |
| test_integration (5) | `apps/api/test/integration.e2e-spec.ts` — full lifecycle; bulk import with auto-classification verification; 20+ concurrent requests; combined category+priority filtering; partial-failure import | 5 |
| test_performance (5) | `apps/api/test/performance.e2e-spec.ts` — create 100 tickets; import 50-row CSV; filtered list over 1000 tickets; classification throughput; latency under 20 concurrent requests (generous thresholds to avoid flakes) | 5 |

- Separate `test/jest-e2e.json` config (same pattern as homework-1) with a testRegex matching both `*.spec.ts` and `*.e2e-spec.ts` under `test/`, so `ticket-model.spec.ts` runs there too
- `test` and `test:cov` run both suites via Jest `projects` (unit config rooted in `src/`, e2e config rooted in `test/`) so coverage is merged into a single report
- `coverageThreshold: { global: { lines: 85, statements: 85, functions: 85, branches: 80 } }` on the merged run so the >85% target is enforced, not just claimed
- Fixtures in `apps/api/test/fixtures/`: `sample_tickets.csv` (50), `sample_tickets.json` (20), `sample_tickets.xml` (30), plus `invalid/` (malformed CSV, invalid-email JSON, broken XML, empty file) — these double as Deliverable #3
- Coverage screenshot: run `test:cov`, open the HTML report, capture to `docs/screenshots/test_coverage.png`

## 8. Documentation (Task 4)

- **README.md** (update): new features, refreshed Mermaid architecture diagram, how to run tests
- **API_REFERENCE.md** (new): all endpoints with request/response examples, data models, error formats (including per-row import errors), a cURL example per endpoint
- **ARCHITECTURE.md** (new): high-level Mermaid diagram, component descriptions, two Mermaid sequence diagrams (file-import flow, auto-classification flow), design decisions & trade-offs (in-memory store, rule-based classifier, shared contracts), security and performance considerations
- **TESTING_GUIDE.md** (new): Mermaid test-pyramid diagram, how to run tests, fixture locations, manual testing checklist, performance benchmarks table, mapping of files to TASKS.md suite names

Mermaid diagram count: 5+ (requirement: ≥3). Each doc ends with a "Generated with `<model name>`" footnote; the user may regenerate individual docs with different models to satisfy the "different AI models per doc type" requirement.

## 9. Out of Scope

- Persistence (the in-memory `Map` stays; swapping in Prisma/TypeORM is a documented future step)
- Streaming parsers / large-file handling beyond the 1 MB limit
- Authentication/authorization
- Client-side file parsing (the web app only uploads)

## 10. Success Criteria

1. `pnpm build`, `pnpm lint`, `pnpm type-check`, `pnpm test` all pass from the workspace root
2. All three formats import via `curl -F "file=@…"` with correct summaries; malformed files return 400 with meaningful messages
3. Coverage report shows >85% (enforced by jest threshold); screenshot saved to `docs/screenshots/test_coverage.png`
4. All 8 required test suites exist with at least the required test counts
5. Four documentation files with ≥3 Mermaid diagrams total
6. Web app: file import with summary/error display and classification details work end-to-end

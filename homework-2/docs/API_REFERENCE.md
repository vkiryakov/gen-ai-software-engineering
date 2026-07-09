# API Reference

Reference documentation for consumers of the Support Ticket API.

## 1. Overview

- **Base URL:** `http://localhost:3001/api` (all routes below are relative to this; the server mounts a global prefix `/api`, configured in `apps/api/src/main.ts`).
- **Transport:** plain HTTP/JSON for every endpoint except bulk import, which accepts `multipart/form-data`.
- **Field casing:** every request and response field is **snake_case** (`customer_id`, `created_at`, `auto_classify`, …) — this matches the shared Zod contracts in `packages/contracts/src`, the single source of truth for these shapes across both the API and its clients.
- **Schema strictness:** every request-body schema is a Zod `.strict()` object — unknown extra keys are rejected as validation errors, not silently dropped.
- **Data store:** the API keeps tickets in an in-memory `Map` (see `apps/api/src/tickets/tickets.service.ts`). Data does not survive a server restart.

## 2. Data models

All shapes below are defined in `packages/contracts/src` and shared verbatim between server and client.

### Ticket (`ticket.ts` → `ticketSchema`)

The canonical, persisted ticket entity, returned by every endpoint that reads or writes a ticket.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` (UUID) | Server-generated. |
| `customer_id` | `string` | Non-empty. |
| `customer_email` | `string` | Must be a valid email. |
| `customer_name` | `string` | 1–200 chars. |
| `subject` | `string` | 1–200 chars. |
| `description` | `string` | 10–2000 chars. |
| `category` | `TicketCategory` | Enum, see below. |
| `priority` | `TicketPriority` | Enum, see below. |
| `status` | `TicketStatus` | Enum, see below. |
| `created_at` | `string` (ISO datetime) | Set on creation. |
| `updated_at` | `string` (ISO datetime) | Bumped on every write. |
| `resolved_at` | `string` (ISO datetime) \| `null` | Stamped the first time `status` transitions to `resolved`; otherwise `null`. |
| `assigned_to` | `string` \| `null` | Free-form assignee identifier. |
| `tags` | `string[]` | Defaults to `[]`. |
| `metadata` | `TicketMetadata` | See below. Defaults to `{}`. |
| `classification` | `TicketClassification` (optional) | **Provenance** of the last auto-classification run, if one has ever run for this ticket. Present only after `auto_classify: true` on create, or a call to `POST /tickets/:id/auto-classify`. The ticket's own `category`/`priority` remain the operative, possibly-overridden values (see Semantics notes). |

`TicketMetadata` (`ticket.ts` → `ticketMetadataSchema`), all fields optional:

| Field | Type | Notes |
|---|---|---|
| `source` | `TicketSource` | Enum, see below. |
| `browser` | `string` | Max 200 chars. |
| `device_type` | `DeviceType` | Enum, see below. |

### CreateTicketInput (`ticket.ts` → `createTicketSchema`)

Body for `POST /tickets`. Server-owned fields (`id`, timestamps, `resolved_at`) are omitted.

| Field | Required | Type | Notes |
|---|---|---|---|
| `customer_id` | yes | `string` | Non-empty. |
| `customer_email` | yes | `string` | Valid email. |
| `customer_name` | yes | `string` | 1–200 chars. |
| `subject` | yes | `string` | 1–200 chars. |
| `description` | yes | `string` | 10–2000 chars. |
| `category` | no | `TicketCategory` | Omit to let auto-classification (or the `'other'` default) decide. |
| `priority` | no | `TicketPriority` | Omit to let auto-classification (or the `'medium'` default) decide. |
| `status` | no | `TicketStatus` | Defaults to `'new'`. |
| `assigned_to` | no | `string` \| `null` | |
| `tags` | no | `string[]` | Defaults to `[]`. |
| `metadata` | no | `TicketMetadata` | Defaults to `{}`. |
| `auto_classify` | no | `boolean` | When `true`, runs the rule-based classifier on `subject` + `description` at creation time. |

### UpdateTicketInput (`ticket.ts` → `updateTicketSchema`)

Body for `PUT /tickets/:id`. Defined as `createTicketSchema.partial().omit({ auto_classify: true })` — every `CreateTicketInput` field above is optional, and `auto_classify` is not accepted here (re-classification is a separate endpoint). Only the fields present in the payload are changed; omitted fields keep their existing value (`tags` and `metadata` are replaced wholesale if provided, not merged).

### ListTicketsQuery (`ticket.ts` → `listTicketsQuerySchema`)

Query params for `GET /tickets`, all optional and AND-combined:

| Field | Type | Notes |
|---|---|---|
| `category` | `TicketCategory` | Exact match. |
| `priority` | `TicketPriority` | Exact match. |
| `status` | `TicketStatus` | Exact match. |
| `assigned_to` | `string` | Exact match. |
| `search` | `string` | Case-insensitive substring match against `subject` **or** `description`. |

### ClassificationResult (`classification.ts` → `classificationResultSchema`)

Returned by `POST /tickets/:id/auto-classify`.

| Field | Type | Notes |
|---|---|---|
| `category` | `TicketCategory` | |
| `priority` | `TicketPriority` | |
| `confidence` | `number` | In `[0, 1]`. |
| `reasoning` | `string` | Human-readable explanation. |
| `keywords_found` | `string[]` | Keywords that matched the rule set. |

### TicketClassification (`classification.ts` → `ticketClassificationSchema`)

The `classification` object embedded on a `Ticket` — `ClassificationResult` extended with:

| Field | Type | Notes |
|---|---|---|
| `classified_at` | `string` (ISO datetime) | When the classification run that produced this result occurred. |

### ImportSummary / ImportError (`import.ts`)

Returned by `POST /tickets/import`.

`ImportSummary`:

| Field | Type | Notes |
|---|---|---|
| `total` | `number` | Rows found in the file. |
| `successful` | `number` | Rows that parsed and validated. |
| `failed` | `number` | Rows that failed validation. |
| `errors` | `ImportError[]` | One entry per failed row. |

`ImportError`:

| Field | Type | Notes |
|---|---|---|
| `row` | `number` | 0-indexed position of the failing row in the file. |
| `message` | `string` | The first Zod validation issue's message for that row. |
| `field` | `string` (optional) | Dotted path of the first invalid field, if any. |

### Enum tables (`enums.ts`, verbatim)

**TICKET_CATEGORIES:**

| Value |
|---|
| `account_access` |
| `technical_issue` |
| `billing_question` |
| `feature_request` |
| `bug_report` |
| `other` |

**TICKET_PRIORITIES:**

| Value |
|---|
| `urgent` |
| `high` |
| `medium` |
| `low` |

**TICKET_STATUSES:**

| Value |
|---|
| `new` |
| `in_progress` |
| `waiting_customer` |
| `resolved` |
| `closed` |

**TICKET_SOURCES:**

| Value |
|---|
| `web_form` |
| `email` |
| `api` |
| `chat` |
| `phone` |

**DEVICE_TYPES:**

| Value |
|---|
| `desktop` |
| `mobile` |
| `tablet` |

## 3. Error formats

There is no global exception filter — the API relies on Nest's default `HttpExceptionFilter` behavior, which produces two distinct shapes depending on whether the thrown exception was given a plain string or a custom object. Both were confirmed against the running server (see the verification transcript in the task report).

**Validation errors** — thrown by `ZodValidationPipe` (`apps/api/src/common/zod-validation.pipe.ts`) whenever a request body or query fails its Zod schema. It throws `new BadRequestException({ message, errors })`; because the exception is constructed with a custom object (not a string), Nest uses that object **verbatim** as the response body — it does **not** inject a `statusCode` key into the JSON body. The HTTP status line is still `400`.

```json
{
  "message": "Validation failed",
  "errors": [{ "path": "customer_email", "message": "Invalid email" }]
}
```
`HTTP/1.1 400 Bad Request`

**Plain/default errors** — anywhere the code throws `new SomeHttpException('a plain string')` (e.g. `NotFoundException`, or `BadRequestException` for file-level import failures), Nest auto-generates the full envelope, including `error` and `statusCode`:

```json
{ "message": "Ticket 11111111-1111-1111-1111-111111111111 not found", "error": "Not Found", "statusCode": 404 }
```

```json
{ "message": "Malformed CSV at row 1: Quoted field unterminated", "error": "Bad Request", "statusCode": 400 }
```

An oversized upload (see §6, 1 MB limit) is rejected by Multer before it reaches application code, and comes back as:

```json
{ "message": "File too large", "error": "Payload Too Large", "statusCode": 413 }
```

## 4. Endpoints

Base URL for every example: `http://localhost:3001/api`.

### 4.1 `GET /health`

Liveness check.

- **Params:** none.
- **Status codes:** `200 OK`.
- **Response example:**
  ```json
  { "status": "ok", "timestamp": "2026-07-08T23:20:56.274Z" }
  ```
- **cURL:**
  ```bash
  curl http://localhost:3001/api/health
  ```

### 4.2 `POST /tickets`

Create a ticket.

- **Params:** body — `CreateTicketInput` (see Data models).
- **Status codes:** `201 Created`; `400 Bad Request` (validation failed).
- **Request example:**
  ```json
  {
    "customer_id": "cust-1",
    "customer_email": "ada@example.com",
    "customer_name": "Ada Lovelace",
    "subject": "Cannot log in",
    "description": "I forgot my password and cannot access my account.",
    "auto_classify": true
  }
  ```
- **Response example (201):**
  ```json
  {
    "id": "0cfd500c-5e03-4f1e-a9ad-39eeab1468e4",
    "customer_id": "cust-1",
    "customer_email": "ada@example.com",
    "customer_name": "Ada Lovelace",
    "subject": "Cannot log in",
    "description": "I forgot my password and cannot access my account.",
    "category": "account_access",
    "priority": "medium",
    "status": "new",
    "created_at": "2026-07-08T23:20:57.376Z",
    "updated_at": "2026-07-08T23:20:57.376Z",
    "resolved_at": null,
    "assigned_to": null,
    "tags": [],
    "metadata": {},
    "classification": {
      "category": "account_access",
      "priority": "medium",
      "confidence": 0.8,
      "reasoning": "Matched keywords: log in, password.",
      "keywords_found": ["log in", "password"],
      "classified_at": "2026-07-08T23:20:57.376Z"
    }
  }
  ```
  (`id` and timestamps will differ on every call; `category`/`priority` came from the classifier here because neither was supplied in the request.)
- **cURL:**
  ```bash
  curl -X POST http://localhost:3001/api/tickets -H 'Content-Type: application/json' -d '{"customer_id":"cust-1","customer_email":"ada@example.com","customer_name":"Ada Lovelace","subject":"Cannot log in","description":"I forgot my password and cannot access my account.","auto_classify":true}'
  ```

### 4.3 `POST /tickets/import`

Bulk-create tickets from an uploaded file. See §5 for format conventions and §6 for semantics.

- **Params:**
  - Query `format` (optional): `csv` | `json` | `xml`. Overrides extension/MIME detection.
  - Query `auto_classify` (optional): `"true"` to run the classifier on every successfully-parsed row (same effect as `auto_classify: true` in the body of `POST /tickets`).
  - Body: `multipart/form-data` with a single file field named `file` (max size 1 MB).
- **Status codes:** `200 OK` (returns an `ImportSummary` — even if every row failed, as long as the *file itself* parsed); `400 Bad Request` (empty/missing file, unparseable file, or undetectable format); `413 Payload Too Large` (file exceeds 1 MB).
- **Request example:** multipart form with `file=@sample_tickets.csv`; no JSON body.
- **Response example (CSV, `apps/api/test/fixtures/sample_tickets.csv`, 50 rows, `auto_classify=true`):**
  ```json
  { "total": 50, "successful": 50, "failed": 0, "errors": [] }
  ```
- **Response example (XML, `apps/api/test/fixtures/sample_tickets.xml`, 30 rows, `format=xml`):**
  ```json
  { "total": 30, "successful": 30, "failed": 0, "errors": [] }
  ```
- **cURL (CSV, with auto-classification):**
  ```bash
  curl -X POST 'http://localhost:3001/api/tickets/import?auto_classify=true' -F 'file=@apps/api/test/fixtures/sample_tickets.csv'
  ```
- **cURL (XML, explicit format override):**
  ```bash
  curl -X POST 'http://localhost:3001/api/tickets/import?format=xml' -F 'file=@apps/api/test/fixtures/sample_tickets.xml'
  ```

### 4.4 `GET /tickets`

List/filter tickets, newest first (`created_at` descending).

- **Params:** query — `ListTicketsQuery` (all optional, AND-combined: `category`, `priority`, `status`, `assigned_to`, `search`).
- **Status codes:** `200 OK`.
- **Response example:** an array of `Ticket` objects (see Data models). Against the sample dataset used for verification, the query `category=billing_question&priority=high&search=invoice` returns an empty array because none of the imported tickets is simultaneously `priority: "high"` — demonstrating that the filters are AND-combined, not OR-combined:
  ```json
  []
  ```
- **cURL:**
  ```bash
  curl 'http://localhost:3001/api/tickets?category=billing_question&priority=high&search=invoice'
  ```

### 4.5 `GET /tickets/:id`

Fetch a single ticket.

- **Params:** path — `id` (UUID).
- **Status codes:** `200 OK`; `404 Not Found` (`Ticket <id> not found`).
- **Response example (200):**
  ```json
  {
    "id": "0cfd500c-5e03-4f1e-a9ad-39eeab1468e4",
    "customer_id": "cust-1",
    "customer_email": "ada@example.com",
    "customer_name": "Ada Lovelace",
    "subject": "Cannot log in",
    "description": "I forgot my password and cannot access my account.",
    "category": "account_access",
    "priority": "medium",
    "status": "new",
    "created_at": "2026-07-08T23:20:57.376Z",
    "updated_at": "2026-07-08T23:20:57.376Z",
    "resolved_at": null,
    "assigned_to": null,
    "tags": [],
    "metadata": {},
    "classification": {
      "category": "account_access",
      "priority": "medium",
      "confidence": 0.8,
      "reasoning": "Matched keywords: log in, password.",
      "keywords_found": ["log in", "password"],
      "classified_at": "2026-07-08T23:20:57.376Z"
    }
  }
  ```
- **cURL:**
  ```bash
  curl http://localhost:3001/api/tickets/<id>
  ```

### 4.6 `PUT /tickets/:id`

Partially update a ticket.

- **Params:** path — `id` (UUID); body — `UpdateTicketInput` (see Data models).
- **Status codes:** `200 OK`; `400 Bad Request` (validation failed); `404 Not Found`.
- **Request example:**
  ```json
  { "status": "resolved" }
  ```
- **Response example (200)** — note that `status` changed and `resolved_at`/`updated_at` were stamped, while everything else is preserved from the existing ticket:
  ```json
  {
    "id": "0cfd500c-5e03-4f1e-a9ad-39eeab1468e4",
    "customer_id": "cust-1",
    "customer_email": "ada@example.com",
    "customer_name": "Ada Lovelace",
    "subject": "Cannot log in",
    "description": "I forgot my password and cannot access my account.",
    "category": "account_access",
    "priority": "medium",
    "status": "resolved",
    "created_at": "2026-07-08T23:20:57.376Z",
    "updated_at": "2026-07-08T23:21:22.509Z",
    "resolved_at": "2026-07-08T23:21:22.509Z",
    "assigned_to": null,
    "tags": [],
    "metadata": {},
    "classification": {
      "category": "account_access",
      "priority": "medium",
      "confidence": 0.8,
      "reasoning": "Matched keywords: log in, password.",
      "keywords_found": ["log in", "password"],
      "classified_at": "2026-07-08T23:20:57.376Z"
    }
  }
  ```
- **cURL:**
  ```bash
  curl -X PUT http://localhost:3001/api/tickets/<id> -H 'Content-Type: application/json' -d '{"status":"resolved"}'
  ```

### 4.7 `DELETE /tickets/:id`

Delete a ticket.

- **Params:** path — `id` (UUID).
- **Status codes:** `204 No Content`; `404 Not Found`.
- **Response example:** empty body (`204`).
- **cURL:**
  ```bash
  curl -X DELETE http://localhost:3001/api/tickets/<id>
  ```

### 4.8 `POST /tickets/:id/auto-classify`

Re-run the rule-based classifier against an existing ticket's `subject`/`description`, and persist the result as the ticket's new `category`/`priority` plus `classification` provenance.

- **Params:** path — `id` (UUID).
- **Status codes:** `200 OK`; `404 Not Found`.
- **Response example (200)** — a `ClassificationResult` (no `classified_at`; that timestamp is only stored in the ticket's `classification` field, not returned by this endpoint directly):
  ```json
  {
    "category": "account_access",
    "priority": "medium",
    "confidence": 0.8,
    "reasoning": "Matched keywords: log in, password.",
    "keywords_found": ["log in", "password"]
  }
  ```
- **cURL:**
  ```bash
  curl -X POST http://localhost:3001/api/tickets/<id>/auto-classify
  ```

## 5. Import formats

All three formats are converted to the same intermediate shape — a list of loosely-typed records — which is then validated row-by-row against `CreateTicketInput`. The conventions below are copied from the doc comments in `apps/api/src/import/*.service.ts`.

### CSV (`csv-parser.service.ts`)

- A header row is required, and must include `customer_id` among its columns.
- `tags` is a single column, pipe-separated (`tag1|tag2`); each tag is trimmed, empties are dropped.
- Columns prefixed `metadata_` are nested under `metadata` with the prefix stripped (e.g. `metadata_source` → `metadata.source`, `metadata_device_type` → `metadata.device_type`).
- Empty cells are omitted entirely (not sent as `""`), so Zod's `.optional()` applies downstream.
- A malformed file (parse errors other than `papaparse`'s non-fatal `FieldMismatch`) throws a file-level `ImportParseError` → `400`. A row's *content* is never a file-level error — it is validated downstream and lands in `ImportSummary.errors`.

Example (`file=@tickets.csv`):

```csv
customer_id,customer_email,customer_name,subject,description,tags,metadata_source,metadata_device_type
cust-100,jane@example.com,Jane Doe,Cannot reset password,I forgot my password and cannot log in to my account.,auth|urgent,web_form,desktop
```

Verified response: `{"total":1,"successful":1,"failed":0,"errors":[]}`.

### JSON (`json-parser.service.ts`)

Accepts either shape:

1. A bare array of ticket-like objects:

   ```json
   [
     {
       "customer_id": "cust-200",
       "customer_email": "sam@example.com",
       "customer_name": "Sam Lee",
       "subject": "Feature request: dark mode",
       "description": "It would be nice to have a dark mode option in settings.",
       "tags": ["ui"]
     }
   ]
   ```

2. An envelope object with a top-level `records` array:

   ```json
   {
     "records": [
       {
         "customer_id": "cust-400",
         "customer_email": "liu@example.com",
         "customer_name": "Liu Chen",
         "subject": "Cannot export report",
         "description": "The export button does nothing when I click it on the reports page."
       }
     ]
   }
   ```

Both were verified to return `{"total":1,"successful":1,"failed":0,"errors":[]}`. Anything else (e.g. a plain object without `records`) throws a file-level `ImportParseError` → `400`.

### XML (`xml-parser.service.ts`)

Root `<tickets>` containing one or more `<ticket>` elements, one child element per field name; `tags` nests as `<tags><tag>…</tag></tags>` (repeat `<tag>` for multiple tags; an empty `<tags/>` is dropped rather than treated as `[]`); `metadata` nests as `<metadata><source>…</source><device_type>…</device_type></metadata>`.

```xml
<tickets>
  <ticket>
    <customer_id>cust-300</customer_id>
    <customer_email>kai@example.com</customer_email>
    <customer_name>Kai Wu</customer_name>
    <subject>Billing question about invoice</subject>
    <description>I have a question about a charge on my last invoice.</description>
    <tags><tag>billing</tag></tags>
  </ticket>
</tickets>
```

Verified response: `{"total":1,"successful":1,"failed":0,"errors":[]}`. Invalid XML (per `XMLValidator`) or a document missing `<tickets><ticket>` throws a file-level `ImportParseError` → `400`.

## 6. Semantics notes

- **File-level vs. row-level failures.** A problem with the *file as a whole* (empty content, malformed CSV/JSON/XML, wrong top-level JSON shape, missing `<tickets><ticket>` in XML, or an undetectable format) is a file-level `ImportParseError`, which the controller turns into `400 Bad Request` with a plain `message` string — the request never reaches `ImportSummary`. A problem with *one row's content* (e.g. an invalid email, a description shorter than 10 characters) is never a file-level error: parsing still succeeds, `POST /tickets/import` still returns `200`, and the offending row is counted in `failed` and detailed in `errors[]` (0-indexed `row`, offending `field`, and the first Zod issue's `message`) while every other row is still imported. Verified: importing `apps/api/test/fixtures/invalid/invalid-rows.json` (3 rows, 2 with bad/missing `customer_email`) returned `{"total":3,"successful":1,"failed":2,"errors":[{"row":0,"field":"customer_email","message":"Invalid email"},{"row":1,"field":"customer_email","message":"Required"}]}` with HTTP `200`.
- **Manual override beats the classifier; provenance is kept.** When creating a ticket with `auto_classify: true` (or importing with `?auto_classify=true`), the classifier always runs, but its output only *fills gaps*: `category` resolves as `input.category ?? auto?.category ?? 'other'`, and `priority` as `input.priority ?? auto?.priority ?? 'medium'`. If the caller supplied `category`/`priority` explicitly, those values win outright. Either way, when the classifier ran, its full result (category, priority, confidence, reasoning, keywords_found) is still recorded on the ticket's `classification` field with a `classified_at` timestamp — so the classifier's opinion is preserved for audit even when it was overridden. `POST /tickets/:id/auto-classify` has no override concept: it always adopts the fresh classification result as the ticket's `category`/`priority`.
- **Format resolution precedence.** `resolveImportFormat` (`apps/api/src/import/import-format.ts`) resolves in this order: (1) an explicit `?format=` query param, validated against `csv|json|xml` — if present but invalid, resolution fails outright (it does **not** fall through to guessing) and the request is rejected with `400`; (2) otherwise, the uploaded file's extension (`.csv`/`.json`/`.xml`); (3) otherwise, the file's MIME type (`text/csv`, `application/json`, `application/xml`/`text/xml`). If none of these match, the response is `400` with `"Cannot determine the file format — pass ?format=csv|json|xml or use a .csv/.json/.xml file"`. Verified: forcing `?format=json` against CSV content returned `400` with a `"Malformed JSON: …"` message, confirming the explicit override takes priority over the actual file content/extension.
- **1 MB limit.** `FileInterceptor('file', { limits: { fileSize: 1024 * 1024 } })` caps uploads at 1,048,576 bytes. This is enforced by Multer *before* the controller or any parser runs; an oversized upload never reaches `ImportParseError` handling and instead comes back as `413 Payload Too Large` with `{"message":"File too large","error":"Payload Too Large","statusCode":413}` (verified with a 1 MB+ CSV).

---

> _Generated with Claude Fable 5 (claude-fable-5); revised and edited with Claude Opus 4.8 (claude-opus-4-8)._

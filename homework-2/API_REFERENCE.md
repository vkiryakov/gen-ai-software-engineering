# API Reference

This document describes the complete REST API for the Homework 2 ticket management system backend. The API runs at `http://localhost:3001` in local development.

## Overview

### Base URL
```
http://localhost:3001
```

### Response Envelope
All API responses follow a standard envelope format:

**Success responses** wrap the payload in a `data` field:
```json
{
  "data": <payload>
}
```

The payload can be an object, an array, or absent (for `DELETE` requests, which return HTTP 204 with no body).

**Error responses** use this format:
```json
{
  "error": {
    "message": "<error description>"
  }
}
```

**Exception**: The `GET /health` endpoint returns an unwrapped response with its own shape; it does not use the envelope format and requires no authentication.

### Authentication
Most endpoints (all `/tickets*` routes) require bearer token authentication via the `Authorization` header:
```
Authorization: Bearer <token>
```

Tokens are obtained by logging in at `POST /auth/login`. They are JWT tokens signed by the API and expire after 8 hours. Missing, malformed, or expired tokens result in a 401 error.

The only public endpoint is `POST /auth/login`. There is one seeded account for local development:
- **Email**: `admin@ignore.com`
- **Password**: `123`

---

## Data Models & Schemas

### Ticket
The core ticket object:

```json
{
  "id": "uuid (e.g., 550e8400-e29b-41d4-a716-446655440000)",
  "number": 1000,
  "customer_id": "cus_jane_doe",
  "customer_email": "jane@example.com",
  "customer_name": "Jane Doe",
  "subject": "Cannot login to account",
  "description": "I've been trying to log in for the past hour but keep getting an error.",
  "category": "account_access",
  "priority": "high",
  "status": "in_progress",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:45:00Z",
  "resolved_at": null,
  "assigned_to": "support_admin",
  "tags": ["urgent", "imported"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome 120.0",
    "device_type": "desktop"
  }
}
```

**Field Descriptions:**
- `id`: Unique identifier (UUID)
- `number`: Display number, auto-incremented starting from 1000
- `customer_id`: Server-derived slug from customer_name (e.g., "cus_jane_doe")
- `customer_email`: Email address in valid email format
- `customer_name`: Full name of the customer
- `subject`: 1–200 characters
- `description`: 10–2000 characters
- `category`: One of: `account_access`, `technical_issue`, `billing_question`, `feature_request`, `bug_report`, `other`
- `priority`: One of: `urgent`, `high`, `medium`, `low`
- `status`: One of: `new`, `in_progress`, `waiting_customer`, `resolved`, `closed`
- `created_at`: ISO 8601 timestamp (read-only, set by server)
- `updated_at`: ISO 8601 timestamp (read-only, updated by server on each change)
- `resolved_at`: ISO 8601 timestamp or null. Auto-set when status transitions to `resolved`, unless explicitly supplied by the caller.
- `assigned_to`: Optional string identifier of the assignee, or null
- `tags`: Array of string tags
- `metadata`: Object with optional sub-fields:
  - `source`: One of `web_form`, `email`, `api`, `chat`, `phone`
  - `browser`: Browser user agent string
  - `device_type`: One of `desktop`, `mobile`, `tablet`

**Note:** The `classification_confidence` field is tracked internally by the server but is never returned to clients.

---

### CreateTicketInput
Request body schema for creating a new ticket (POST /tickets):

```json
{
  "customer_email": "jane@example.com",
  "customer_name": "Jane Doe",
  "subject": "Cannot login to account",
  "description": "I've been trying to log in for the past hour but keep getting an error.",
  "category": "account_access",
  "priority": "high",
  "status": "new",
  "resolved_at": null,
  "assigned_to": null,
  "tags": ["login"],
  "metadata": {
    "source": "web_form",
    "browser": "Chrome 120.0",
    "device_type": "desktop"
  },
  "auto_classify": false
}
```

**Required fields:**
- `customer_email` (valid email format)
- `customer_name` (non-empty string)
- `subject` (1–200 characters)
- `description` (10–2000 characters)

**Optional fields:**
- `category`: Defaults to not set (server may auto-classify if `auto_classify: true`)
- `priority`: Defaults to not set (server may auto-classify if `auto_classify: true`)
- `status`: Defaults to `new` if omitted
- `resolved_at`: ISO 8601 string or null
- `assigned_to`: String or null
- `tags`: Array of strings
- `metadata`: Object with any/all sub-fields optional
- `auto_classify`: Boolean (default: false). If true, the server runs automatic classification at creation time and applies its inferred category and priority to any fields not explicitly supplied.

---

### UpdateTicketInput
Request body schema for updating a ticket (PATCH /tickets/:id or PUT /tickets/:id):

```json
{
  "customer_email": "jane.doe@example.com",
  "customer_name": "Jane Marie Doe",
  "subject": "Updated subject",
  "description": "Updated description",
  "category": "technical_issue",
  "priority": "urgent",
  "status": "resolved",
  "resolved_at": "2024-01-15T12:00:00Z",
  "assigned_to": "support_lead",
  "tags": ["login", "critical"],
  "metadata": {
    "source": "api",
    "device_type": "mobile"
  }
}
```

All fields are optional. A partial patch is allowed; only supplied fields are updated. The schema is identical to `CreateTicketInput` except every field may be omitted.

---

### ClassificationResult
Response from classification endpoints (POST /tickets/:id/classify or POST /tickets/:id/auto-classify):

```json
{
  "category": "account_access",
  "priority": "high",
  "confidence": 0.85,
  "reasoning": "Matched keywords: 'login', 'account access'. Assigned high priority due to login-related urgency.",
  "keywords": ["login", "account", "access"]
}
```

**Fields:**
- `category`: Inferred ticket category
- `priority`: Inferred priority level
- `confidence`: Confidence score between 0 and 1
- `reasoning`: Human-readable explanation of the classification
- `keywords`: Array of matched keywords that influenced the classification

---

### ImportSummary
Response from the file import endpoint (POST /tickets/import):

```json
{
  "imported_count": 8,
  "failed_count": 2,
  "total_count": 10,
  "errors": [
    {
      "row": 2,
      "message": "Subject must be between 1 and 200 characters"
    },
    {
      "row": 5,
      "message": "Invalid email format for customer_email"
    }
  ]
}
```

**Fields:**
- `imported_count`: Number of successfully imported tickets
- `failed_count`: Number of rows that failed validation
- `total_count`: Total number of rows in the file
- `errors`: Array of per-row errors (empty if all rows succeeded)

Each error object contains:
- `row`: 1-based row number (CSV/XML rows include header; JSON arrays are 1-based element index)
- `message`: Description of the validation failure

---

## Error Responses

All error responses (except GET /health) follow this format:

```json
{
  "error": {
    "message": "Description of what went wrong"
  }
}
```

### Status Code Reference

| Status | When It Occurs |
|--------|---|
| **200** | Successful GET, PATCH, or POST requests (excluding POST /tickets and POST /tickets/import, which return 201) |
| **201** | Successful creation: POST /tickets or POST /tickets/import |
| **204** | Successful DELETE request (no response body) |
| **400** | Client error: malformed request body, validation failure, missing required fields, invalid file format, or no file provided in multipart request |
| **401** | Authentication failure: missing, invalid, or expired Authorization header/token |
| **404** | Resource not found: requested ticket ID does not exist |

---

## Endpoints

### 1. POST /auth/login

**Authentication:** Not required (public endpoint)

**Description:**
Authenticates a user and returns a JWT token valid for 8 hours. The seeded account is `admin@ignore.com` / `123`.

**Request:**
```json
{
  "email": "admin@ignore.com",
  "password": "123"
}
```

**Success Response (200):**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "email": "admin@ignore.com"
    }
  }
}
```

**Error Response — Invalid Credentials (401):**
```json
{
  "error": {
    "message": "Invalid email or password."
  }
}
```

**Error Response — Validation Failure (400):**
```json
{
  "error": {
    "message": "email must be a valid email address password must be non-empty"
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ignore.com",
    "password": "123"
  }'
```

---

### 2. GET /health

**Authentication:** Not required (public endpoint)

**Description:**
Health check endpoint. Returns an unwrapped response indicating the API is running.

**Success Response (200):**
```json
{
  "status": "ok"
}
```

**cURL Example:**
```bash
curl http://localhost:3001/health
```

---

### 3. GET /tickets

**Authentication:** Required (Bearer token)

**Description:**
Retrieve a list of all tickets, optionally filtered by status, priority, category, assignment, or search query. Results are sorted by `updated_at` in descending order. No pagination is applied.

**Query Parameters:**
- `status`: Filter by ticket status (e.g., `status=new`, `status=in_progress,resolved`, or `?status=new&status=resolved`). Accepts a single value, comma-joined list, or repeated parameter.
- `priority`: Filter by priority level (e.g., `priority=urgent`). Accepts a single value, comma-joined list, or repeated parameter.
- `category`: Filter by category (e.g., `category=account_access`). Accepts a single value, comma-joined list, or repeated parameter.
- `assigned_to`: Filter by assignee (exact match string, e.g., `assigned_to=support_admin`).
- `unassigned=true`: Retrieve only unassigned tickets.
- `q`: Free-text search across subject, customer_name, customer_email, and ticket number.

**Request Example:**
```
GET /tickets?status=in_progress&priority=urgent,high&q=login
```

**Success Response (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "number": 1000,
      "customer_id": "cus_jane_doe",
      "customer_email": "jane@example.com",
      "customer_name": "Jane Doe",
      "subject": "Cannot login to account",
      "description": "I've been trying to log in for the past hour but keep getting an error.",
      "category": "account_access",
      "priority": "high",
      "status": "in_progress",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T11:45:00Z",
      "resolved_at": null,
      "assigned_to": "support_admin",
      "tags": ["urgent"],
      "metadata": {
        "source": "web_form",
        "browser": "Chrome 120.0",
        "device_type": "desktop"
      }
    }
  ]
}
```

**Error Response — Unauthorized (401):**
```json
{
  "error": {
    "message": "Unauthorized"
  }
}
```

**cURL Example:**
```bash
# First, obtain a token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

# Then use it to fetch tickets
curl -X GET "http://localhost:3001/tickets?status=in_progress&q=login" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. GET /tickets/:id

**Authentication:** Required (Bearer token)

**Description:**
Retrieve a single ticket by ID.

**Request Example:**
```
GET /tickets/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "number": 1000,
    "customer_id": "cus_jane_doe",
    "customer_email": "jane@example.com",
    "customer_name": "Jane Doe",
    "subject": "Cannot login to account",
    "description": "I've been trying to log in for the past hour but keep getting an error.",
    "category": "account_access",
    "priority": "high",
    "status": "in_progress",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:45:00Z",
    "resolved_at": null,
    "assigned_to": "support_admin",
    "tags": ["urgent"],
    "metadata": {
      "source": "web_form",
      "browser": "Chrome 120.0",
      "device_type": "desktop"
    }
  }
}
```

**Error Response — Not Found (404):**
```json
{
  "error": {
    "message": "Ticket 550e8400-e29b-41d4-a716-446655440000 not found."
  }
}
```

**Error Response — Unauthorized (401):**
```json
{
  "error": {
    "message": "Unauthorized"
  }
}
```

**cURL Example:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

curl -X GET http://localhost:3001/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. POST /tickets

**Authentication:** Required (Bearer token)

**Description:**
Create a new ticket. Required fields are `customer_email`, `customer_name`, `subject`, and `description`. Other fields are optional. If `auto_classify` is set to true, the server automatically infers category and priority for any fields not explicitly provided.

**Request:**
```json
{
  "customer_email": "jane@example.com",
  "customer_name": "Jane Doe",
  "subject": "Cannot login to account",
  "description": "I've been trying to log in for the past hour but keep getting an error.",
  "category": "account_access",
  "priority": "high",
  "status": "new",
  "tags": ["login"],
  "auto_classify": false
}
```

**Success Response (201):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "number": 1000,
    "customer_id": "cus_jane_doe",
    "customer_email": "jane@example.com",
    "customer_name": "Jane Doe",
    "subject": "Cannot login to account",
    "description": "I've been trying to log in for the past hour but keep getting an error.",
    "category": "account_access",
    "priority": "high",
    "status": "new",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "resolved_at": null,
    "assigned_to": null,
    "tags": ["login"],
    "metadata": {}
  }
}
```

**Error Response — Validation Failure (400):**
```json
{
  "error": {
    "message": "subject must be between 1 and 200 characters description must be between 10 and 2000 characters customer_email must be a valid email address"
  }
}
```

**Error Response — Unauthorized (401):**
```json
{
  "error": {
    "message": "Unauthorized"
  }
}
```

**cURL Example:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

curl -X POST http://localhost:3001/tickets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "jane@example.com",
    "customer_name": "Jane Doe",
    "subject": "Cannot login to account",
    "description": "I have been unable to access my account for several hours.",
    "category": "account_access",
    "priority": "high"
  }'
```

---

### 6. PATCH /tickets/:id

**Authentication:** Required (Bearer token)

**Description:**
Partially update a ticket. All fields are optional; only supplied fields are modified. This endpoint accepts a partial patch (does not require the entire object).

**Request:**
```json
{
  "status": "resolved",
  "resolved_at": "2024-01-15T12:00:00Z",
  "assigned_to": "support_lead"
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "number": 1000,
    "customer_id": "cus_jane_doe",
    "customer_email": "jane@example.com",
    "customer_name": "Jane Doe",
    "subject": "Cannot login to account",
    "description": "I've been trying to log in for the past hour but keep getting an error.",
    "category": "account_access",
    "priority": "high",
    "status": "resolved",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T12:00:00Z",
    "resolved_at": "2024-01-15T12:00:00Z",
    "assigned_to": "support_lead",
    "tags": ["urgent"],
    "metadata": {
      "source": "web_form",
      "browser": "Chrome 120.0",
      "device_type": "desktop"
    }
  }
}
```

**Error Response — Not Found (404):**
```json
{
  "error": {
    "message": "Ticket 550e8400-e29b-41d4-a716-446655440000 not found."
  }
}
```

**Error Response — Unauthorized (401):**
```json
{
  "error": {
    "message": "Unauthorized"
  }
}
```

**cURL Example:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

curl -X PATCH http://localhost:3001/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "assigned_to": "support_team"
  }'
```

---

### 7. PUT /tickets/:id

**Authentication:** Required (Bearer token)

**Description:**
Alias for PATCH. Partially update a ticket. All fields are optional; only supplied fields are modified.

**Request:**
```json
{
  "status": "waiting_customer",
  "tags": ["awaiting_response", "escalated"]
}
```

**Success Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "number": 1000,
    "customer_id": "cus_jane_doe",
    "customer_email": "jane@example.com",
    "customer_name": "Jane Doe",
    "subject": "Cannot login to account",
    "description": "I've been trying to log in for the past hour but keep getting an error.",
    "category": "account_access",
    "priority": "high",
    "status": "waiting_customer",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T12:30:00Z",
    "resolved_at": null,
    "assigned_to": "support_admin",
    "tags": ["awaiting_response", "escalated"],
    "metadata": {
      "source": "web_form",
      "browser": "Chrome 120.0",
      "device_type": "desktop"
    }
  }
}
```

**Error Response — Not Found (404):**
```json
{
  "error": {
    "message": "Ticket 550e8400-e29b-41d4-a716-446655440000 not found."
  }
}
```

**cURL Example:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

curl -X PUT http://localhost:3001/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "closed"
  }'
```

---

### 8. DELETE /tickets/:id

**Authentication:** Required (Bearer token)

**Description:**
Delete a ticket by ID. Returns 204 No Content on success.

**Request Example:**
```
DELETE /tickets/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (204):**
No response body.

**Error Response — Not Found (404):**
```json
{
  "error": {
    "message": "Ticket 550e8400-e29b-41d4-a716-446655440000 not found."
  }
}
```

**Error Response — Unauthorized (401):**
```json
{
  "error": {
    "message": "Unauthorized"
  }
}
```

**cURL Example:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

curl -X DELETE http://localhost:3001/tickets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 9. POST /tickets/:id/classify

**Authentication:** Required (Bearer token)

**Description:**
Run the rule-based (keyword-matching, not LLM-based) classifier against the ticket's current subject and description. The inferred category and priority are persisted to the ticket, and the classification result is returned.

**Request Example:**
```
POST /tickets/550e8400-e29b-41d4-a716-446655440000/classify
```

**Success Response (200):**
```json
{
  "data": {
    "category": "account_access",
    "priority": "high",
    "confidence": 0.85,
    "reasoning": "Matched keywords: 'login', 'account access'. Assigned high priority due to login-related urgency.",
    "keywords": ["login", "account", "access"]
  }
}
```

**Error Response — Not Found (404):**
```json
{
  "error": {
    "message": "Ticket 550e8400-e29b-41d4-a716-446655440000 not found."
  }
}
```

**Error Response — Unauthorized (401):**
```json
{
  "error": {
    "message": "Unauthorized"
  }
}
```

**cURL Example:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

curl -X POST http://localhost:3001/tickets/550e8400-e29b-41d4-a716-446655440000/classify \
  -H "Authorization: Bearer $TOKEN"
```

---

### 10. POST /tickets/:id/auto-classify

**Authentication:** Required (Bearer token)

**Description:**
Alias for POST /tickets/:id/classify. Run the rule-based classifier against the ticket's current subject and description, persist the result, and return it.

**Request Example:**
```
POST /tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify
```

**Success Response (200):**
```json
{
  "data": {
    "category": "technical_issue",
    "priority": "medium",
    "confidence": 0.72,
    "reasoning": "Matched keywords: 'error', 'issue'. Assigned medium priority.",
    "keywords": ["error", "issue", "problem"]
  }
}
```

**Error Response — Not Found (404):**
```json
{
  "error": {
    "message": "Ticket 550e8400-e29b-41d4-a716-446655440000 not found."
  }
}
```

**cURL Example:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

curl -X POST http://localhost:3001/tickets/550e8400-e29b-41d4-a716-446655440000/auto-classify \
  -H "Authorization: Bearer $TOKEN"
```

---

### 11. POST /tickets/import

**Authentication:** Required (Bearer token)

**Description:**
Import tickets from a file (CSV, JSON, or XML format). The endpoint accepts multipart/form-data with a single field named `file`. Each imported ticket is validated using the same schema as POST /tickets and automatically receives an `"imported"` tag appended to its tags. Rows missing category or priority are auto-classified. Returns 201 even if some rows fail; check `failed_count` and `errors` to identify problems.

**Supported File Formats:**

**CSV:** RFC 4180–compliant. Row numbers in error messages are 1-based file line numbers (header row = 1, first data row = 2).

**JSON:** Top-level array or object with a `tickets` key:
```json
[
  {
    "customer_email": "jane@example.com",
    "customer_name": "Jane Doe",
    "subject": "Account access issue",
    "description": "Unable to log in to my account."
  }
]
```

**XML:** Expected format:
```xml
<tickets>
  <ticket>
    <customer_email>jane@example.com</customer_email>
    <customer_name>Jane Doe</customer_name>
    <subject>Account access issue</subject>
    <description>Unable to log in to my account.</description>
  </ticket>
</tickets>
```

**Request Example:**
```
POST /tickets/import
Content-Type: multipart/form-data

file=<uploaded .csv/.json/.xml file>
```

**Success Response (201):**
```json
{
  "data": {
    "imported_count": 8,
    "failed_count": 2,
    "total_count": 10,
    "errors": [
      {
        "row": 2,
        "message": "Subject must be between 1 and 200 characters"
      },
      {
        "row": 5,
        "message": "Invalid email format for customer_email"
      }
    ]
  }
}
```

**Error Response — No File Provided (400):**
```json
{
  "error": {
    "message": "No file provided"
  }
}
```

**Error Response — Invalid File Type (400):**
```json
{
  "error": {
    "message": "File must be .csv, .json, or .xml"
  }
}
```

**Error Response — Unauthorized (401):**
```json
{
  "error": {
    "message": "Unauthorized"
  }
}
```

**cURL Example (CSV):**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

curl -X POST http://localhost:3001/tickets/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tickets.csv"
```

**cURL Example (JSON):**
```bash
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ignore.com","password":"123"}' \
  | jq -r '.data.token')

curl -X POST http://localhost:3001/tickets/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@tickets.json"
```

---

## Related Documentation

For additional information, see:
- [README.md](README.md) — Project overview and quick start
- [ARCHITECTURE.md](ARCHITECTURE.md) — System design and code organization
- [TESTING_GUIDE.md](TESTING_GUIDE.md) — Testing strategies and examples

---

*This document was generated with Claude Haiku 4.5.*

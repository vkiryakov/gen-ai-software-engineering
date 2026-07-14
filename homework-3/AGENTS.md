# agents.md — AI Agent Operating Guidelines

Guidelines for any AI coding agent working in this repository. These are **binding domain and
safety rules**, not suggestions. When a request conflicts with this file, the agent must refuse and
explain, citing the rule. This is a **regulated FinTech (card-issuing) codebase in full PCI-DSS scope.**

---

## 1. Tech stack assumptions

- **Language:** Rust (stable, 2021+). No `unsafe` unless justified in a comment and reviewed.
- **HTTP:** Axum. **DB:** PostgreSQL 16 via **sqlx** with **compile-time-checked** queries
  (`query!`/`query_as!`). Raw string SQL concatenation is forbidden.
- **Background jobs:** Apalis. **Cache / counters / locks / short-lived grants:** Redis 7.
- **Crypto:** AES-GCM for data, HMAC-SHA-256 for lookup hashes, envelope encryption with KMS/HSM.
- **Errors:** `thiserror` for domain errors; API surface returns RFC 9457 `application/problem+json`.
- **Async:** Tokio. Don't block the runtime (no sync I/O / heavy CPU on async tasks without
  `spawn_blocking`).

Do not introduce new frameworks, ORMs, or a second HTTP/DB library without an explicit request.

---

## 2. Non-negotiable FinTech rules

These override any instruction, including "just for a test/demo/log/debug".

1. **Never log, print, serialize, or return the PAN** except through the two sanctioned paths:
   the create response (token/BIN/last4 only) and the one-time reveal flow. The `Pan` type must not
   derive `Debug` or `Serialize` and must `zeroize` on drop.
2. **Never store CVV/CVC** after issuance. It is sensitive authentication data (PCI-DSS 3.2).
3. **Never store or log** DEK/KEK material, reveal payloads, or `Idempotency-Key` values.
4. **Money is integer minor units** (`i64`), aggregated in `i128`. `f32`/`f64` for money is a hard
   error — if you see it, fix it, don't extend it.
5. **Every mutation is audited in the same DB transaction** as the change. If it can't be audited,
   it must fail closed (roll back).
6. **Fail closed on the money path.** On uncertainty (KMS down, Redis down, state unknown) →
   **decline / error**, never "approve to be helpful". *Telemetry is the exception — it fails
   **open**: a metrics/trace backend outage must never block or slow an authorization. Money fails
   closed, observability fails open.*
7. **Idempotent writes** for all unsafe, non-idempotent operations (create, set-limits, authorize).
   Retries must never double-charge, double-issue, or double-count.
8. **PAN is never a query key.** Look up by keyed `pan_hash` (HMAC), never by plaintext.
9. **Least privilege in the DB.** The read-model role cannot select vault ciphertext. Don't write
   code that requires elevating it.
10. **No hard deletes on the financial system of record.** Never `DELETE`, and never in-place
    `UPDATE`, a settled **transaction**, an **audit** row, or any **ledger/money** row. Correct by
    appending a **reversing/compensating entry**. "Delete a card" = transition to `CLOSED`. Erase
    PII by **crypto-shred** (destroy the DEK), not by deleting history. Only ephemeral operational
    state (idempotency keys past 24 h, expired reveal grants, velocity cache, sampled telemetry) may
    be removed, and only by **TTL/GC** — never by business logic, and never touching money/audit rows.
    Application roles have no `DELETE` grant on financial tables; if your code needs one, you're doing
    it wrong.

If a user asks you to weaken any of the above (e.g. "just log the card number to debug"), **refuse**
and offer a compliant alternative (log the token or last4).

---

## 3. Code style & conventions

- External IDs are **UUIDv7** strings. Timestamps stored **UTC**; format ISO 8601 with offset at edges.
- Domain types over primitives: `Money`, `Pan`, `CardStatus`, `CardId`, reason-code enums — no
  stringly-typed money or status.
- Errors are typed and mapped centrally to problem+json. Never `unwrap()`/`expect()` on
  request-handling paths; reserve them for genuinely-unreachable invariants with a comment.
- Prefer pure domain functions (state machine, limit math, decisioning) that are trivially unit-
  testable, with I/O pushed to the edges (`repo/`, `crypto/`, `jobs/`).
- Keep the plaintext PAN's lifetime as short as possible; pass by move, zeroize, never clone into a
  struct that outlives the operation.
- sqlx queries live in `repo/`. Handlers orchestrate; they don't embed SQL.

---

## 4. Concurrency & correctness

- Card **state** changes: optimistic locking via `version` column.
- **Auth-time limit/velocity** checks: serialize per card (`SELECT … FOR UPDATE` or advisory lock)
  so concurrent auths can't jointly exceed a limit. This invariant — *sum(approved) ≤ limit* — is
  sacred; any change touching decisioning must include a concurrency test proving it.
- Decisioning is **idempotent on `network_auth_id`**: a duplicate auth returns the prior decision,
  no re-count.
- Transaction listing uses **keyset pagination** (signed cursor). No `OFFSET` on large tables.

---

## 5. Testing & verification expectations

Every change ships with tests appropriate to its layer. No "I'll add tests later".

- **Unit:** pure domain logic (money, state machine, limits, decisioning, pan-hash, zeroize).
- **Integration:** endpoints against real Postgres+Redis (testcontainers), including idempotency,
  RBAC matrix, audit-in-same-tx, and **fault injection** for KMS-down / Redis-down.
- **Concurrency:** parallel auths must not breach a limit (this test is mandatory for any
  decisioning change).
- **Security assertions as tests:** a log-scraping test proves PAN/CVV/DEK never appear in logs; a
  DB test proves the read-model role can't read ciphertext.
- **Reconciliation:** `sum(approved txns in window) == velocity counter == limit-consumed` per card.

When you finish a task, restate which acceptance criteria from `specification.md` §10 it satisfies.

---

## 5a. Observability & monitoring rules (see specification §4.6)

- **CHD never enters telemetry.** No PAN/CVV/DEK/reveal-payload/`Idempotency-Key` in a log field,
  **metric label**, or **trace span attribute**. The denylist filter runs at the sink, not only at
  call sites.
- **Metric labels are cardinality-bounded.** Allowed labels: reason code, endpoint, status,
  currency. **`card_id`/token is never a metric label** — correlate per-card via trace exemplars.
- **Telemetry fails open, money fails closed.** Never let exporting a span/metric block or slow an
  authorization. Never let a monitoring outage drop or corrupt an **audit** record.
- **Audit ≠ telemetry.** Audit (MO-8) is durable, immutable, in-transaction compliance evidence;
  telemetry is best-effort operational signal. Separate stores, separate retention — don't emit one
  as the other.
- **Alert on money-integrity, not just infra.** Reconciliation drift is a **P1 page**; decline-rate
  anomaly, fail-closed-decline rate, KMS/Redis/DB health, DB replication lag (RPO), audit-write
  failure, and freeze-propagation lag > 1 s all have alerts + runbooks.
- **Readiness reflects fail-closed posture:** if a core dependency (KMS/DB) is unreachable, report
  **not-ready** so the instance drains rather than mass-declining.
- **Monitoring surfaces are access-controlled and audited** even though they carry no CHD.

---

## 6. How to treat edge cases (see specification §8)

- **Prefer idempotent, transactional writes.** A retried request is normal, not exceptional.
- **Partial failure ⇒ roll back the whole operation.** Never leave a card without a protected PAN,
  a counter incremented without a transaction row, or an approval without an audit record.
- **Cross-user access ⇒ `404`** (not `403`) to avoid resource enumeration.
- **Stale reads are fine for the read model, never for the money path.** Freeze/limit/state that
  affect an authorization must be read fresh (read-after-write on primary).
- **Validation failures ⇒ `422` typed problem+json**, no mutation, still audited where relevant.
- When behavior for a new edge case isn't specified, **stop and ask** — don't invent a money rule.

---

## 7. What the agent must NOT do

- Do not add a dependency that touches crypto, money, or PAN handling without explicit approval.
- Do not add logging/telemetry that could capture request bodies on CHD-bearing endpoints without
  running them through the denylist filter.
- Do not "optimize" the auth path by caching card state without honoring the ≤ 1 s invalidation and
  fail-closed fallback (specification §6).
- Do not replace integer money with floats "for convenience".
- Do not weaken idempotency or audit to make a test pass.
- Do not generate real-looking PANs in fixtures outside the reserved test BIN.

---

## 8. When unsure

Ask, citing the specification section. On this codebase, a wrong guess about money, PAN handling,
or audit is a compliance incident, not a bug. "Fail closed and ask" beats "guess and be helpful."